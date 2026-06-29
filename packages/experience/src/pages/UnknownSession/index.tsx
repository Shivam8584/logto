import { experience } from '@logto/schemas';
import { useContext } from 'react';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import { usePreserveSearchParams } from '@/hooks/use-navigate-with-preserved-search-params';
import ErrorPage from '@/pages/ErrorPage';

/**
 * The "Session not found" page, shown when the server-side SPA session guard could not find a live
 * OIDC interaction for a guarded path (see `koa-spa-session-guard.ts`) and redirected here.
 *
 * Recovery is the whole point of this page, and it is subtle: the underlying OIDC interaction can
 * only be (re)minted by oidc-provider's `/oidc/auth`, which the Koa guard re-evaluates on a *full
 * document load*. A client-side SPA `navigate('/sign-in')` skips the guard entirely, so it would
 * merely re-render the sign-in form over the same dead session — the user submits, the guard throws
 * again, and they bounce straight back here. That is the loop this page exists to break.
 *
 * Therefore the primary action performs a **full-page** redirect (never an SPA navigation):
 * - If the tenant configured `unknownSessionRedirectUrl`, send the user there — it is the intended
 *   "send the user back to the app's login entry to start a fresh interaction" escape hatch.
 * - Otherwise fall back to a full-page load of `/sign-in`, which re-enters the guard so a fresh
 *   interaction can mint if the originating app context (the `app_id` search param) is still present.
 */
const UnknownSession = () => {
  const { experienceSettings } = useContext(PageContext);
  const { getTo } = usePreserveSearchParams();

  const unknownSessionRedirectUrl = experienceSettings?.unknownSessionRedirectUrl;

  return (
    <ErrorPage
      title="error.invalid_session"
      primaryAction={{
        title: 'description.back_to_sign_in',
        onClick: () => {
          if (unknownSessionRedirectUrl) {
            window.location.assign(unknownSessionRedirectUrl);
            return;
          }

          // Preserve `app_id` so the guard can rebind the interaction to the originating client.
          const { pathname, search } = getTo(`/${experience.routes.signIn}`);
          window.location.assign(`${pathname ?? ''}${search ? `?${search}` : ''}`);
        },
      }}
    />
  );
};

export default UnknownSession;
