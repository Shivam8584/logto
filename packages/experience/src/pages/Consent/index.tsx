import { ReservedResource } from '@logto/core-kit';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import LandingPageLayout from '@/Layout/LandingPageLayout';
import { consent, getConsentInfo } from '@/apis/consent';
import TermsLinks from '@/components/TermsLinks';
import TextLink from '@/components/TextLink';
import useApi from '@/hooks/use-api';
import useErrorHandler, { type ErrorHandlers } from '@/hooks/use-error-handler';
import useGlobalRedirectTo from '@/hooks/use-global-redirect-to';
import ErrorPage from '@/pages/ErrorPage';
import { queryKeys } from '@/query-client';
import Button from '@/shared/components/Button';
import { searchKeys } from '@/shared/utils/search-parameters';

import OrganizationSelector, { type Organization } from './OrganizationSelector';
import ScopesListCard from './ScopesListCard';
import UserProfile from './UserProfile';
import { getRedirectUriOrigin } from './util';

const Consent = () => {
  const handleError = useErrorHandler();
  const asyncConsent = useApi(consent);
  const { t } = useTranslation();
  const redirectTo = useGlobalRedirectTo();

  const [selectedOrganization, setSelectedOrganization] = useState<Organization>();
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const [isConsentLoading, setIsConsentLoading] = useState(false);

  const consentErrorHandlers: ErrorHandlers = useMemo(
    () => ({
      'oidc.access_denied': () => {
        setIsAccessDenied(true);
      },
    }),
    []
  );

  const handleConsentError = useCallback(
    async (error: unknown) => {
      await handleError(error, consentErrorHandlers);
    },
    [consentErrorHandlers, handleError]
  );

  /**
   * Consent info fetch via TanStack Query — replaces the manual
   * useState(data) + useState(loading) + useEffect pattern. Loading/error/caching
   * are handled by the query; errors are routed through the existing error handler.
   */
  const { data: consentData, error: consentInfoError } = useQuery({
    queryKey: queryKeys.consentInfo,
    queryFn: getConsentInfo,
  });

  useEffect(() => {
    if (consentInfoError) {
      void handleConsentError(consentInfoError);
    }
  }, [consentInfoError, handleConsentError]);

  // Initialize the default organization selection once consent info loads.
  useEffect(() => {
    const [firstOrganization] = consentData?.organizations ?? [];

    if (firstOrganization) {
      setSelectedOrganization(firstOrganization);
    }
  }, [consentData]);

  const signOut = useCallback(() => {
    const applicationId =
      new URLSearchParams(window.location.search).get(searchKeys.appId) ??
      consentData?.application.id;
    const signOutUrl = new URL('/oidc/session/end', window.location.origin);

    if (applicationId) {
      signOutUrl.searchParams.set('client_id', applicationId);
    }

    window.location.assign(signOutUrl.href);
  }, [consentData?.application.id]);

  const consentHandler = useCallback(async () => {
    setIsConsentLoading(true);
    const [error, result] = await asyncConsent(selectedOrganization?.id);
    setIsConsentLoading(false);

    if (error) {
      await handleConsentError(error);

      return;
    }

    if (result?.redirectTo) {
      await redirectTo(result.redirectTo);
    }
  }, [asyncConsent, handleConsentError, redirectTo, selectedOrganization?.id]);

  if (isAccessDenied) {
    return (
      <ErrorPage
        isNavbarHidden
        title="error.access_denied"
        message="error.application_access_denied"
        primaryAction={{
          title: 'account_center.sessions.revoke_session',
          onClick: signOut,
        }}
      />
    );
  }

  // The consent-info fetch failed with something other than access-denied (e.g. an
  // expired interaction or a network error). Without this the page returns null and
  // the user is left on a blank screen with at most a transient toast.
  if (consentInfoError && !consentData) {
    return <ErrorPage title="error.invalid_session" />;
  }

  if (!consentData) {
    return null;
  }

  const {
    application: { displayName, name, termsOfUseUrl, privacyPolicyUrl },
  } = consentData;

  const applicationName = displayName ?? name;
  const showTerms = Boolean(termsOfUseUrl ?? privacyPolicyUrl);
  const { redirectUri } = consentData;
  const redirectUriOrigin = consentData.redirectUri
    ? getRedirectUriOrigin(consentData.redirectUri)
    : undefined;

  return (
    <LandingPageLayout
      title="description.authorize_title"
      titleInterpolation={{
        name: applicationName,
      }}
      thirdPartyBranding={consentData.application.branding}
    >
      <UserProfile user={consentData.user} />
      <ScopesListCard
        userScopes={consentData.missingOIDCScope}
        /**
         * The org resources is included in the user scopes for compatibility.
         */
        resourceScopes={consentData.missingResourceScopes?.filter(
          ({ resource }) => resource.id !== ReservedResource.Organization
        )}
        appName={applicationName}
        className="mt-6 mobile:mt-4 desktop:mt-6"
      />
      {consentData.organizations && (
        <OrganizationSelector
          className="mt-6"
          organizations={consentData.organizations}
          selectedOrganization={selectedOrganization}
          onSelect={setSelectedOrganization}
        />
      )}
      <div className="mt-7 flex items-center gap-2">
        {redirectUri && (
          <Button
            title="action.cancel"
            type="secondary"
            onClick={() => {
              window.location.replace(redirectUri);
            }}
          />
        )}
        <Button title="action.authorize" isLoading={isConsentLoading} onClick={consentHandler} />
      </div>
      {!showTerms && redirectUriOrigin && (
        <div className="mt-5 text-center text-xs font-medium text-muted">
          {t('description.redirect_to', { name: redirectUriOrigin })}
        </div>
      )}
      {showTerms && redirectUriOrigin && (
        <div className="mt-5 text-xs text-muted">
          <Trans
            components={{
              link: (
                <TermsLinks
                  inline
                  termsOfUseUrl={termsOfUseUrl ?? ''}
                  privacyPolicyUrl={privacyPolicyUrl ?? ''}
                />
              ),
            }}
          >
            {t('description.authorize_agreement_with_redirect', {
              name,
              uri: redirectUriOrigin,
            })}
          </Trans>
        </div>
      )}
      {showTerms && !redirectUriOrigin && (
        <div className="mt-5 text-xs text-muted">
          <Trans
            components={{
              link: (
                <TermsLinks
                  inline
                  termsOfUseUrl={termsOfUseUrl ?? ''}
                  privacyPolicyUrl={privacyPolicyUrl ?? ''}
                />
              ),
            }}
          >
            {t('description.authorize_agreement', {
              name,
            })}
          </Trans>
        </div>
      )}
      <div className="items-center mt-6 flex justify-center gap-1">
        {t('description.not_you')}{' '}
        <TextLink replace to="/sign-in" text="action.use_another_account" />
      </div>
    </LandingPageLayout>
  );
};

export default Consent;
