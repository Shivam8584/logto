import { experience } from '@logto/schemas';
import { useQuery } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import StaticPageLayout from '@/Layout/StaticPageLayout';
import PageContext from '@/Providers/PageContextProvider/PageContext';
import { getConsentInfo } from '@/apis/consent';
import TextLink from '@/components/TextLink';
import useErrorHandler from '@/hooks/use-error-handler';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import UserProfile from '@/pages/Consent/UserProfile';
import ErrorPage from '@/pages/ErrorPage';
import { queryKeys } from '@/query-client';
import Button from '@/shared/components/Button';
import DynamicT from '@/shared/components/DynamicT';
import LoadingLayer from '@/shared/components/LoadingLayer';
import PageMeta from '@/shared/components/PageMeta';
import { getBrandingLogoUrl } from '@/shared/utils/logo';

/**
 * This component is only used when there's an active session, and then the user
 * is trying to sign-in with another account (e.g., using a magic link).
 */
const SwitchAccount = () => {
  const { experienceSettings, theme } = useContext(PageContext);
  const navigate = useNavigateWithPreservedSearchParams();
  const handleError = useErrorHandler();

  const [params] = useSearchParams();
  const loginHint = params.get('login_hint');

  // Consent info fetch via TanStack Query (replaces manual useState + useEffect).
  const { data: consentData, error: consentInfoError } = useQuery({
    queryKey: queryKeys.consentInfo,
    queryFn: getConsentInfo,
  });

  useEffect(() => {
    if (consentInfoError) {
      void handleError(consentInfoError);
    }
  }, [consentInfoError, handleError]);

  if (!loginHint) {
    return <ErrorPage title="error.unknown" message="error.unknown" />;
  }

  if (!experienceSettings || !consentData) {
    return <LoadingLayer />;
  }

  const {
    color: { isDarkModeEnabled },
    branding,
  } = experienceSettings;
  const logoUrl = getBrandingLogoUrl({ theme, branding, isDarkModeEnabled });

  return (
    <StaticPageLayout>
      <PageMeta titleKey="description.switch_account" />
      <div className="flex flex-1 flex-col items-center justify-center w-full mx-auto max-w-[var(--max-w)]">
        {logoUrl && <img className="h-10 w-auto mx-auto" src={logoUrl} alt="app logo" />}
        <div className="mt-8 text-sm font-medium self-start w-full [overflow-wrap:anywhere] mobile:mb-4 desktop:mb-2">
          <DynamicT
            forKey="description.switch_account_title"
            interpolation={{ account: consentData.user.primaryEmail }}
          />
        </div>
        <UserProfile user={consentData.user} className="w-full" />
        <div className="mt-6 text-sm self-start">
          <DynamicT forKey="description.switch_account_description" />
        </div>
        <Button
          className="mt-2"
          type="primary"
          size="large"
          title="action.continue_as"
          i18nProps={{ name: loginHint }}
          onClick={() => {
            navigate(
              { pathname: `/${experience.routes.oneTimeToken}`, search: `?${params.toString()}` },
              { replace: true }
            );
          }}
        />
        <div className="mt-6">
          <TextLink
            text="action.back_to_current_account"
            onClick={() => {
              // Return to the app via the FULL redirect URI (keeping the OIDC
              // continuation), not the origin-only display value. Fall back to a
              // fresh sign-in so the link is never a silent no-op.
              if (consentData.redirectUri) {
                window.location.assign(consentData.redirectUri);
              } else {
                navigate('/' + experience.routes.signIn, { replace: true });
              }
            }}
          />
        </div>
      </div>
    </StaticPageLayout>
  );
};

export default SwitchAccount;
