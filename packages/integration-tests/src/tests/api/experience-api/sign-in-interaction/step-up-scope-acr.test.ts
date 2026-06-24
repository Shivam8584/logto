/**
 * Scope-level step-up ACR enforcement (Phase 3 — grant-time).
 *
 * These tests verify that setting `required_acr` on a scope (or `default_acr` on a resource)
 * causes the OIDC `refresh_token` grant to throw `InsufficientUserAuthentication` (HTTP 401,
 * `error=insufficient_user_authentication` per RFC 9470 §3) when the session ACR is below the
 * requirement, and that the token IS issued once the session is elevated.
 *
 * Coverage:
 *   1. Scope with `required_acr=mfa` → token blocked when session is `pwd`, passes after MFA.
 *   2. Resource `default_acr=mfa` → token blocked for all scopes when session is `pwd`.
 *   3. Resolver precedence: scope ACR > resource default (scope `phr` beats resource `mfa`).
 *   4. CRUD API round-trip: PATCH scope / resource persists the ACR field.
 */

import {
  InteractionEvent,
  LogtoAcrValues,
  MfaFactor,
  SignInIdentifier,
  type Resource,
} from '@logto/schemas';
import { authenticator } from 'otplib';

import { createUserMfaVerification, updateUserLogtoConfig } from '#src/api/admin-user.js';
import { createResource, deleteResource, updateResource } from '#src/api/resource.js';
import { createScope, updateScope } from '#src/api/scope.js';
import { initExperienceClient, processSession } from '#src/helpers/client.js';
import { identifyUserWithUsernamePassword } from '#src/helpers/experience/index.js';
import { successfullyVerifyTotp } from '#src/helpers/experience/totp-verification.js';
import {
  enableAllPasswordSignInMethods,
  enableUserControlledMfaWithNoPrompt,
  resetMfaSettings,
} from '#src/helpers/sign-in-experience.js';
import { generateNewUserProfile, UserApiTest } from '#src/helpers/user.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const signInAtPasswordLevel = async (userApi: UserApiTest) => {
  const { username, password } = generateNewUserProfile({ username: true, password: true });
  const user = await userApi.create({ username, password });

  const totp = await createUserMfaVerification(user.id, MfaFactor.TOTP);
  if (totp.type !== MfaFactor.TOTP) {
    throw new Error('unexpected mfa type');
  }

  // Skip MFA at sign-in so the session stays at `pwd` level.
  await updateUserLogtoConfig(user.id, { mfa: { skipMfaOnSignIn: true } });

  const client = await initExperienceClient();
  await identifyUserWithUsernamePassword(client, username, password);
  const { redirectTo } = await client.submitInteraction();
  await processSession(client, redirectTo);

  return { client, user, username, password, totpSecret: totp.secret };
};

type SignedInClient = Awaited<ReturnType<typeof signInAtPasswordLevel>>['client'];

const elevateSessionToMfa = async (client: SignedInClient, totpSecret: string) => {
  await client.startStepUpAuthorization(LogtoAcrValues.Mfa);
  await client.initInteraction({ interactionEvent: InteractionEvent.SignIn });
  const code = authenticator.generate(totpSecret);
  await successfullyVerifyTotp(client, { code });
  const { redirectTo } = await client.submitInteraction();
  await processSession(client, redirectTo);
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('scope-level step-up ACR enforcement (RFC 9470)', () => {
  const userApi = new UserApiTest();
  // eslint-disable-next-line @silverhand/fp/no-let
  let createdResources: Resource[] = [];

  beforeAll(async () => {
    await enableAllPasswordSignInMethods({
      identifiers: [SignInIdentifier.Username],
      password: true,
      verify: false,
    });
    await enableUserControlledMfaWithNoPrompt();
  });

  afterAll(async () => {
    await Promise.all([
      ...createdResources.map(async (resource) => deleteResource(resource.id)),
      userApi.cleanUp(),
      resetMfaSettings(),
    ]);
  });

  const trackResource = (resource: Resource): Resource => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    createdResources = [...createdResources, resource];
    return resource;
  };

  it('blocks a token for a scope with required_acr=mfa when session is pwd', async () => {
    const resource = trackResource(await createResource());

    const scope = await createScope(resource.id);
    await updateScope(resource.id, scope.id, { requiredAcr: LogtoAcrValues.Mfa });

    const { client } = await signInAtPasswordLevel(userApi);

    await expect(client.getAccessToken(resource.indicator)).rejects.toThrow();
  });

  it('issues the token after the session is elevated to MFA', async () => {
    const resource = trackResource(await createResource());

    const scope = await createScope(resource.id);
    await updateScope(resource.id, scope.id, { requiredAcr: LogtoAcrValues.Mfa });

    const { client, totpSecret } = await signInAtPasswordLevel(userApi);

    await elevateSessionToMfa(client, totpSecret);

    const token = await client.getAccessToken(resource.indicator);
    expect(token).toBeTruthy();
  });

  it('blocks when resource default_acr=mfa and scope has no explicit required_acr', async () => {
    const resource = trackResource(await createResource());

    await updateResource(resource.id, { defaultAcr: LogtoAcrValues.Mfa });
    await createScope(resource.id);

    const { client } = await signInAtPasswordLevel(userApi);

    await expect(client.getAccessToken(resource.indicator)).rejects.toThrow();
  });

  it('scope required_acr wins over resource default_acr (phr > mfa)', async () => {
    const resource = trackResource(await createResource());

    // Resource default is MFA.
    await updateResource(resource.id, { defaultAcr: LogtoAcrValues.Mfa });

    const scope = await createScope(resource.id);
    // Scope overrides with phishing-resistant.
    await updateScope(resource.id, scope.id, { requiredAcr: LogtoAcrValues.PhishingResistant });

    const { client, totpSecret } = await signInAtPasswordLevel(userApi);

    // Elevate to MFA (TOTP) — satisfies Mfa but NOT PhishingResistant (no WebAuthn).
    await elevateSessionToMfa(client, totpSecret);

    // Token is still blocked because scope requires phr.
    await expect(client.getAccessToken(resource.indicator)).rejects.toThrow();
  });

  it('CRUD round-trip: PATCH scope with requiredAcr persists the value', async () => {
    const resource = trackResource(await createResource());

    const scope = await createScope(resource.id);

    const updated = await updateScope(resource.id, scope.id, {
      requiredAcr: LogtoAcrValues.Mfa,
    });

    expect(updated.requiredAcr).toBe(LogtoAcrValues.Mfa);

    const cleared = await updateScope(resource.id, scope.id, { requiredAcr: null });
    expect(cleared.requiredAcr).toBeNull();
  });

  it('CRUD round-trip: PATCH resource with defaultAcr persists the value', async () => {
    const resource = trackResource(await createResource());

    const updated = await updateResource(resource.id, { defaultAcr: LogtoAcrValues.Mfa });
    expect(updated.defaultAcr).toBe(LogtoAcrValues.Mfa);

    const cleared = await updateResource(resource.id, { defaultAcr: null });
    expect(cleared.defaultAcr).toBeNull();
  });
});
