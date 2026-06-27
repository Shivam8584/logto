import { buildBuiltInApplicationDataForTenant, isBuiltInApplicationId } from '@logto/schemas';
import { type MiddlewareType } from 'koa';
import type { Provider } from 'oidc-provider';
import { errors } from 'oidc-provider';

import RequestError from '#src/errors/RequestError/index.js';
import { consent } from '#src/libraries/session/index.js';
import type { WithInteractionDetailsContext } from '#src/middleware/koa-interaction-details.js';
import { findResourceScopes } from '#src/oidc/resource.js';
import type Libraries from '#src/tenants/Libraries.js';
import type Queries from '#src/tenants/Queries.js';
import assertThat from '#src/utils/assert-that.js';

/**
 * Automatically consent for the first party apps.
 */

const shouldAutoConsentApplication = async (clientId: string, query: Queries) => {
  const {
    applications: { findApplicationById },
  } = query;

  const application = isBuiltInApplicationId(clientId)
    ? buildBuiltInApplicationDataForTenant('', clientId)
    : await findApplicationById(clientId);

  return !application.isThirdParty;
};

/** Split a possibly-undefined OIDC `scope` param into a deduped list. */
const parseScopeParam = (scope: unknown): string[] =>
  typeof scope === 'string' ? [...new Set(scope.split(' ').filter(Boolean))] : [];

/** Normalize the OIDC `resource` param (string | string[] | undefined) to a list. */
const parseResourceParam = (resource: unknown): string[] => {
  if (typeof resource === 'string') {
    return [resource];
  }
  if (Array.isArray(resource)) {
    return resource.filter((value): value is string => typeof value === 'string');
  }
  return [];
};

/**
 * Build the scopes to grant for a first-party auto-consent from the AUTHORIZE
 * REQUEST (not the prompt's missing-scope delta).
 *
 * Why not `getMissingScopes(prompt)`: that returns only scopes not already in the
 * existing grant. On a re-authentication for an already-consented app — notably a
 * `prompt=login` STEP-UP (RFC 9470 ACR) — the delta is empty, so auto-consent
 * grants nothing, and oidc-provider then issues an authorization code that does
 * NOT carry `offline_access` or the requested API resource for THIS interaction.
 * The result is a reduced grant: no refresh token (issueRefreshToken keys off
 * `code.scopes.has('offline_access')`) and an opaque default-resource access
 * token instead of the API-resource one — so every subsequent `/me/*` call 401s
 * after a step-up.
 *
 * Granting the REQUESTED scopes every time is idempotent (re-granting an
 * already-granted scope is a no-op for a normal login, where requested == missing
 * on first consent) and makes a step-up re-auth carry exactly the same grant as a
 * fresh login. Resource scopes are intersected with what the user is actually
 * allowed (via `findResourceScopes`) so we never over-grant.
 */
const buildRequestedConsentScopes = async ({
  interactionDetails,
  queries,
  libraries,
  userId,
  clientId,
}: {
  interactionDetails: Awaited<ReturnType<Provider['interactionDetails']>>;
  queries: Queries;
  libraries: Libraries;
  userId: string;
  clientId: string;
}): Promise<{ missingOIDCScopes: string[]; resourceScopesToGrant: Record<string, string[]> }> => {
  const { params } = interactionDetails;
  const requestedScopes = parseScopeParam(params.scope);
  const requestedResources = parseResourceParam(params.resource);

  // Resource scopes — for each requested resource, grant the requested scopes
  // that the user is actually entitled to (intersection with findResourceScopes,
  // so we never over-grant).
  const perResource = await Promise.all(
    requestedResources.map(async (indicator): Promise<[string, string[]]> => {
      const availableScopes = await findResourceScopes({
        queries,
        libraries,
        indicator,
        userId,
        applicationId: clientId,
        // Consent/code-exchange flow: inherit scopes from all the user's org roles.
        findFromOrganizations: false,
      });
      const availableNames = new Set(availableScopes.map(({ name }) => name));
      return [indicator, requestedScopes.filter((scope) => availableNames.has(scope))];
    })
  );

  const resourceScopesToGrant = Object.fromEntries(
    perResource.filter(([, scopes]) => scopes.length > 0)
  );
  const grantedResourceScopeNames = new Set(perResource.flatMap(([, scopes]) => scopes));

  // OIDC scopes = every requested scope that isn't a resource scope. This covers
  // the reserved scopes (`openid`, and crucially `offline_access` — what makes
  // the issued code refresh-able) plus the user scopes (profile/email/roles/
  // organizations/etc.), matching exactly what a fresh login grants.
  const missingOIDCScopes = requestedScopes.filter(
    (scope) => !grantedResourceScopeNames.has(scope)
  );

  return { missingOIDCScopes, resourceScopesToGrant };
};

const isApplicationAccessDeniedError = (error: unknown) =>
  error instanceof RequestError && error.code === 'oidc.access_denied';

export default function koaAutoConsent<
  StateT,
  ContextT extends WithInteractionDetailsContext,
  ResponseBodyT,
>(
  provider: Provider,
  query: Queries,
  libraries: Libraries
): MiddlewareType<StateT, ContextT, ResponseBodyT> {
  return async (ctx, next) => {
    const { interactionDetails } = ctx;
    const {
      params: { client_id: clientId },
      session,
    } = interactionDetails;

    assertThat(session, new RequestError({ code: 'session.not_found' }));
    assertThat(
      clientId && typeof clientId === 'string',
      new errors.InvalidClient('client must be available')
    );

    const shouldAutoConsent = await shouldAutoConsentApplication(clientId, query);

    if (shouldAutoConsent) {
      try {
        await libraries.applicationAccessControl.assertUserHasApplicationAccess(
          clientId,
          session.accountId
        );
      } catch (error: unknown) {
        if (isApplicationAccessDeniedError(error)) {
          return next();
        }

        throw error;
      }

      // Grant the REQUESTED scopes + resource (not the prompt's missing-scope
      // delta), so a re-authentication for an already-consented app — notably a
      // `prompt=login` step-up — issues a code that still carries `offline_access`
      // and the API resource, exactly like a fresh login. See
      // `buildRequestedConsentScopes` for the full rationale.
      const { missingOIDCScopes, resourceScopesToGrant } = await buildRequestedConsentScopes({
        interactionDetails,
        queries: query,
        libraries,
        userId: session.accountId,
        clientId,
      });

      const redirectTo = await consent({
        ctx,
        provider,
        queries: query,
        interactionDetails,
        missingOIDCScopes,
        resourceScopesToGrant,
        markAppLevelAccessControlChecked: true,
      });

      ctx.redirect(redirectTo);
      return;
    }

    return next();
  };
}
