import {
  AgreeToTermsPolicy,
  experience,
  ExtraParamsKey,
  SignInIdentifier,
  SignInMode,
} from '@logto/schemas';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';

import LandingPageLayout from '@/Layout/LandingPageLayout';
import SingleSignOnFormModeContextProvider from '@/Providers/SingleSignOnFormModeContextProvider';
import SingleSignOnFormModeContext from '@/Providers/SingleSignOnFormModeContextProvider/SingleSignOnFormModeContext';
import WebAuthnContextProvider from '@/Providers/WebAuthnContextProvider';
import ContinueWithPhoneButton from '@/components/Button/ContinueWithPhoneButton';
import PasskeySignInButton from '@/components/Button/PasskeySignInButton';
import Divider from '@/components/Divider';
import GoogleOneTap from '@/components/GoogleOneTap';
import TextLink from '@/components/TextLink';
import SocialSignInList from '@/containers/SocialSignInList';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import TermsAndPrivacyLinks from '@/containers/TermsAndPrivacyLinks';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import { useSieMethods } from '@/hooks/use-sie';
import useStepUpAcr from '@/hooks/use-step-up-acr';
import useTerms from '@/hooks/use-terms';

import ErrorPage from '../ErrorPage';

import Main from './Main';

const SignInFooters = () => {
  const { t } = useTranslation();
  const { termsValidation, agreeToTermsPolicy } = useTerms();
  const navigate = useNavigateWithPreservedSearchParams();

  const {
    signInMethods,
    signUpMethods,
    socialConnectors,
    signInMode,
    singleSignOnEnabled,
    passkeySignIn,
  } = useSieMethods();

  const { showSingleSignOnForm } = useContext(SingleSignOnFormModeContext);

  const handleSsoNavigation = useCallback(async () => {
    /**
     * Check if the user has agreed to the terms and privacy policy before navigating to the SSO page
     * when the policy is set to `Manual`
     */
    if (agreeToTermsPolicy === AgreeToTermsPolicy.Manual && !(await termsValidation())) {
      return;
    }
    navigate('/single-sign-on/email');
  }, [agreeToTermsPolicy, navigate, termsValidation]);

  /* Hide footers when showing Single Sign On form */
  if (showSingleSignOnForm) {
    return null;
  }

  return (
    <>
      {
        // Single Sign On footer
        singleSignOnEnabled && (
          <>
            <div className="text-center text-xs text-muted mb-4">
              {t('description.use')}{' '}
              <TextLink text="action.single_sign_on" onClick={handleSsoNavigation} />
            </div>
            {
              /**
               * If only SSO sign-in methods are available, display the agreement checkbox when the agreement policy is `Manual`.
               */
              signInMethods.length === 0 &&
                socialConnectors.length === 0 &&
                agreeToTermsPolicy === AgreeToTermsPolicy.Manual && (
                  <TermsAndPrivacyCheckbox className="justify-center" />
                )
            }
          </>
        )
      }
      {
        // Create Account footer
        signInMode === SignInMode.SignInAndRegister && signUpMethods.length > 0 && (
          <div className="text-center text-base text-ink mb-5">
            {t('description.no_account')}{' '}
            <TextLink replace to="/register" text="action.create_account" />
          </div>
        )
      }
      {
        // Alternate sign-in methods — social providers and/or a dedicated
        // "Continue with phone" button. Phone gets its own button (instead of being
        // folded into the smart field) so it's an explicit, always-visible option that
        // routes to a focused phone screen with the country selector shown. The "or"
        // divider appears once if EITHER a phone button or social buttons are shown.
        (() => {
          const hasPhone = signInMethods.some(
            ({ identifier }) => identifier === SignInIdentifier.Phone
          );
          // Social is an *alternate* here only when an inline sign-in form exists. With no
          // sign-in methods, `Main` already renders the social list as the primary option,
          // so showing it again in the footer would duplicate every social button.
          const hasSocial = socialConnectors.length > 0 && signInMethods.length > 0;
          // Only worth a divider/alt-section when the inline form has a non-phone method
          // to be the primary path (otherwise phone is already the inline form).
          const hasNonPhoneInline = signInMethods.some(
            ({ identifier }) => identifier !== SignInIdentifier.Phone
          );

          if (!(hasSocial || (hasPhone && hasNonPhoneInline))) {
            return null;
          }

          return (
            <>
              <Divider label="description.or" className="mb-4" />
              {hasSocial && (
                <SocialSignInList socialConnectors={socialConnectors} className="mb-4" />
              )}
              {hasPhone && hasNonPhoneInline && (
                <ContinueWithPhoneButton mode="signIn" className="mb-4" />
              )}
            </>
          );
        })()
      }
      {passkeySignIn?.enabled && passkeySignIn.showPasskeyButton && <PasskeySignInButton />}
    </>
  );
};

const SignIn = () => {
  const { signInMethods, socialConnectors, signInMode } = useSieMethods();
  const { agreeToTermsPolicy } = useTerms();
  const [params] = useSearchParams();
  const stepUpAcr = useStepUpAcr();

  if (!signInMode) {
    return <ErrorPage />;
  }

  if (signInMode === SignInMode.Register) {
    return <Navigate to="/register" />;
  }

  /**
   * Step-up authentication (RFC 9470): the OIDC server has injected `step_up_acr`
   * into the URL because `acr_values` was requested and the existing session does
   * not yet satisfy it. Redirect to the step-up flow which skips the
   * identifier/password step and shows only MFA verification.
   */
  if (stepUpAcr) {
    return <Navigate replace to={{ pathname: '/step-up', search: `?${params.toString()}` }} />;
  }

  if (params.get(ExtraParamsKey.OneTimeToken)) {
    return (
      <Navigate
        replace
        to={{ pathname: `/${experience.routes.oneTimeToken}`, search: `?${params.toString()}` }}
      />
    );
  }

  return (
    <LandingPageLayout title="description.sign_in_to_your_account">
      <GoogleOneTap context="signin" />
      <WebAuthnContextProvider>
        <SingleSignOnFormModeContextProvider>
          <Main signInMethods={signInMethods} socialConnectors={socialConnectors} />
          <SignInFooters />
        </SingleSignOnFormModeContextProvider>
      </WebAuthnContextProvider>
      {
        // Only show terms and privacy links for sign in page if the agree to terms policy is `Automatic` or `ManualRegistrationOnly`
        agreeToTermsPolicy !== AgreeToTermsPolicy.Manual && (
          <TermsAndPrivacyLinks className="mt-4 text-center text-xs text-muted" />
        )
      }
    </LandingPageLayout>
  );
};

export default SignIn;
