/**
 * Step-up ACR enforcement at token-issuance time (RFC 9470).
 *
 * At grant time (refresh-token, token-exchange, authorization-code), once the set of scopes
 * being granted into an access token is known we look up their `required_acr` from the DB,
 * resolve the effective required ACR (scope > resource > app > org max), and compare it to
 * the session's current ACR.
 *
 * Two enforcement modes:
 *   - HARD (default): throws {@link InsufficientUserAuthentication} (HTTP 401,
 *     `error=insufficient_user_authentication` per RFC 9470 §3) when the session ACR is below
 *     the required level or has expired. The error carries `acr_values` and, when a freshness
 *     window applies, `max_age` — the exact parameters RFC 9470 Figure 2/3 require in the
 *     WWW-Authenticate Bearer challenge. The client SDK re-authorises with `acr_values=…`.
 *   - STRIP (optional): silently removes the under-guarded scopes from the token. Use this
 *     when the client should still receive a valid token for non-sensitive scopes without
 *     re-authentication.
 *
 * Error code rationale:
 *   - RFC 6750 `insufficient_scope` (HTTP 403) = "token lacks granted scope" (capability gap).
 *   - RFC 9470 `insufficient_user_authentication` (HTTP 401) = "user auth strength inadequate"
 *     (assurance gap). These are semantically distinct; using the wrong one breaks clients that
 *     parse the error to decide whether to re-request scopes vs. re-authenticate.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9470 | RFC 9470 §3 — Step-Up Error Response}
 */

import { AcrShortfallReason, evaluateAcr, resolveRequiredAcr } from '@logto/schemas';
import { errors } from 'oidc-provider';

import type Queries from '#src/tenants/Queries.js';

const { OIDCProviderError } = errors;

/**
 * RFC 9470 §3 step-up challenge error.
 *
 * Thrown at the AS token endpoint when a granted scope's `required_acr` exceeds the session's
 * current ACR. HTTP 401 with `error=insufficient_user_authentication`.
 *
 * Fields carried on the error are the exact parameters RFC 9470 Figure 2/3 place in the
 * `WWW-Authenticate: Bearer` challenge:
 *   - `acr_values` — space-separated list of ACR values the client SHOULD request next.
 *   - `max_age`    — (optional) maximum elapsed seconds since last authentication.
 *
 * These are exposed so any middleware layer (resource server, Koa error handler) can build a
 * standards-compliant challenge without re-deriving the required ACR.
 */
export class InsufficientUserAuthentication extends OIDCProviderError {
  /** RFC 9470 §3: the ACR value(s) the client should include in the follow-up auth request. */
  readonly acr_values: string;

  /** RFC 9470 §3: maximum elapsed seconds since last active auth event (freshness window). */
  readonly max_age?: number;

  constructor(description: string, requiredAcr: string, maxAge?: number) {
    super(401, 'insufficient_user_authentication');
    this.name = 'InsufficientUserAuthentication';
    this.error_description = description;
    this.acr_values = requiredAcr;

    if (maxAge !== undefined) {
      this.max_age = maxAge;
    }
  }
}

type AcrEnforcementMode = 'hard' | 'strip';

type AcrEnforcementContext = {
  /** Scope names currently being granted into the access token. */
  grantedScopeNames: string[];
  /** The resource indicator (URL) the token is being issued for. */
  resourceIndicator: string;
  /** The session's current ACR value, taken from the refresh / id token. */
  sessionAcr?: string;
  /** When the current ACR was established (seconds since epoch, like OIDC `auth_time`). */
  sessionAcrEstablishedAt?: number;
  /** Per-app `defaultAcrValues` baseline from the client metadata. */
  applicationDefaultAcrs?: Array<string | undefined>;
  /**
   * Freshness TTL for the required ACR in seconds. When the session's last elevation
   * is older than this, the session is treated as un-elevated even if the ACR rank is
   * sufficient. `undefined` disables the freshness check.
   */
  freshnessTtlSeconds?: number;
  /** Current time in seconds since epoch. Pass `Date.now() / 1000` from the caller. */
  nowSeconds: number;
};

/**
 * Enforce the step-up ACR requirement for a token-issuance grant.
 *
 * - Mode `'hard'` (default): throws {@link InsufficientUserAuthentication} (HTTP 401,
 *   `error=insufficient_user_authentication` per RFC 9470 §3) when the session ACR is below
 *   the required level or has expired. The error carries `acr_values` (and `max_age` for
 *   freshness failures) so a WWW-Authenticate middleware can build the RFC 9470 challenge.
 *
 * - Mode `'strip'`: returns the subset of scope names whose individual `required_acr`
 *   the session satisfies, stripping any that need a higher ACR. If every scope passes,
 *   returns the original array unchanged.
 *
 * @returns The (possibly narrowed) scope-name set when mode is `'strip'`, or the original
 *   names when mode is `'hard'` and the check passes.
 */
export const enforceAcrForGrant = async (
  queries: Queries,
  ctx: AcrEnforcementContext,
  mode: AcrEnforcementMode = 'hard'
): Promise<string[]> => {
  const {
    grantedScopeNames,
    resourceIndicator,
    sessionAcr,
    sessionAcrEstablishedAt,
    applicationDefaultAcrs,
    freshnessTtlSeconds,
    nowSeconds,
  } = ctx;

  if (grantedScopeNames.length === 0) {
    return grantedScopeNames;
  }

  const [scopeRows, resourceRow] = await Promise.all([
    queries.scopes.findScopesByNamesAndResourceIndicator(grantedScopeNames, resourceIndicator),
    queries.resources.findResourceByIndicator(resourceIndicator),
  ]);

  if (mode === 'strip') {
    // Per-scope check: only strip scopes the session can't satisfy individually.
    const sessionState = { acr: sessionAcr, acrEstablishedAt: sessionAcrEstablishedAt };

    const passing = grantedScopeNames.filter((name) => {
      const scopeRow = scopeRows.find((row) => row.name === name);
      const effectiveRequired = resolveRequiredAcr({
        scopeAcrs: [scopeRow?.requiredAcr],
        resourceDefaultAcr: resourceRow?.defaultAcr,
        applicationDefaultAcrs,
      });

      if (!effectiveRequired) {
        return true;
      }

      return (
        evaluateAcr(sessionState, effectiveRequired, nowSeconds, freshnessTtlSeconds) === undefined
      );
    });

    return passing;
  }

  // Hard mode: compute the single highest requirement across all granted scopes.
  const requiredAcr = resolveRequiredAcr({
    scopeAcrs: scopeRows.map((row) => row.requiredAcr),
    resourceDefaultAcr: resourceRow?.defaultAcr,
    applicationDefaultAcrs,
  });

  if (!requiredAcr) {
    return grantedScopeNames;
  }

  const shortfall = evaluateAcr(
    { acr: sessionAcr, acrEstablishedAt: sessionAcrEstablishedAt },
    requiredAcr,
    nowSeconds,
    freshnessTtlSeconds
  );

  if (shortfall === AcrShortfallReason.Stale) {
    // Pass freshnessTtlSeconds as max_age so the WWW-Authenticate challenge tells the client
    // exactly how fresh the re-authentication must be (RFC 9470 §3 Figure 3).
    throw new InsufficientUserAuthentication(
      `step-up required: session ACR "${sessionAcr ?? 'none'}" has exceeded the freshness window for "${requiredAcr}"`,
      requiredAcr,
      freshnessTtlSeconds
    );
  }

  if (shortfall === AcrShortfallReason.Insufficient) {
    throw new InsufficientUserAuthentication(
      `step-up required: session ACR "${sessionAcr ?? 'none'}" does not satisfy required "${requiredAcr}"`,
      requiredAcr
    );
  }

  return grantedScopeNames;
};
