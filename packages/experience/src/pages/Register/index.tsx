import {
  AgreeToTermsPolicy,
  experience,
  ExtraParamsKey,
  SignInIdentifier,
  SignInMode,
} from '@logto/schemas';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';

import LandingPageLayout from '@/Layout/LandingPageLayout';
import SingleSignOnFormModeContextProvider from '@/Providers/SingleSignOnFormModeContextProvider';
import SingleSignOnFormModeContext from '@/Providers/SingleSignOnFormModeContextProvider/SingleSignOnFormModeContext';
import ContinueWithPhoneButton from '@/components/Button/ContinueWithPhoneButton';
import Divider from '@/components/Divider';
import GoogleOneTap from '@/components/GoogleOneTap';
import IdentifierRegisterForm from '@/components/IdentifierRegisterForm';
import TextLink from '@/components/TextLink';
import SocialSignInList from '@/containers/SocialSignInList';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import TermsAndPrivacyLinks from '@/containers/TermsAndPrivacyLinks';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import usePlatform from '@/hooks/use-platform';
import { useSieMethods } from '@/hooks/use-sie';
import useTerms from '@/hooks/use-terms';

import ErrorPage from '../ErrorPage';

const RegisterFooter = () => {
  const { t } = useTranslation();
  const { signUpMethods, socialConnectors, signInMode, signInMethods, singleSignOnEnabled } =
    useSieMethods();
  const { termsValidation, agreeToTermsPolicy } = useTerms();
  const navigate = useNavigateWithPreservedSearchParams();
  const [params] = useSearchParams();

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

  if (params.get(ExtraParamsKey.OneTimeToken)) {
    return (
      <Navigate
        replace
        to={{ pathname: `/${experience.routes.oneTimeToken}`, search: `?${params.toString()}` }}
      />
    );
  }

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
            <div className="text-center mb-4">
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
        // SignIn footer
        signInMode === SignInMode.SignInAndRegister && signInMethods.length > 0 && (
          <div className="text-center mb-4">
            {t('description.have_account')} <TextLink replace to="/sign-in" text="action.sign_in" />
          </div>
        )
      }
      {
        // Alternate sign-up methods — social providers and/or a dedicated
        // "Continue with phone" button (mirrors the sign-in page). Phone gets its own
        // button so the primary field stays an unambiguous email/username entry.
        (() => {
          const hasPhone = signUpMethods.includes(SignInIdentifier.Phone);
          // Social is an *alternate* here only when an inline sign-up form exists. With no
          // sign-up methods, the body already renders the social list as the primary option,
          // so showing it again in the footer would duplicate every social button.
          const hasSocial = socialConnectors.length > 0 && signUpMethods.length > 0;
          const hasNonPhoneInline = signUpMethods.some(
            (identifier) => identifier !== SignInIdentifier.Phone
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
                <ContinueWithPhoneButton mode="register" className="mb-4" />
              )}
            </>
          );
        })()
      }
    </>
  );
};

const Register = () => {
  const { signUpMethods, socialConnectors, signInMode } = useSieMethods();
  const { agreeToTermsPolicy } = useTerms();
  const { isMobile } = usePlatform();

  // Drop phone from the inline field (it's surfaced as a "Continue with phone" button in
  // RegisterFooter) unless phone is the only method, so the field is never empty.
  const inlineSignUpMethods = useMemo(() => {
    const nonPhone = signUpMethods.filter((identifier) => identifier !== SignInIdentifier.Phone);
    return nonPhone.length > 0 ? nonPhone : signUpMethods;
  }, [signUpMethods]);

  if (!signInMode) {
    return <ErrorPage />;
  }

  if (signInMode === SignInMode.SignIn) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <LandingPageLayout title="description.create_your_account">
      <GoogleOneTap context="signup" />
      <SingleSignOnFormModeContextProvider>
        {inlineSignUpMethods.length > 0 && (
          // Autofocus on desktop only (avoid forcing the keyboard open on mobile).
          <IdentifierRegisterForm
            autoFocus={!isMobile}
            signUpMethods={inlineSignUpMethods}
            className="mb-4"
          />
        )}
        {/* Social sign-in methods only */}
        {signUpMethods.length === 0 && socialConnectors.length > 0 && (
          <>
            {agreeToTermsPolicy !== AgreeToTermsPolicy.Automatic && (
              <TermsAndPrivacyCheckbox className="mb-4 text-center text-xs text-muted" />
            )}
            <SocialSignInList className="mb-4" socialConnectors={socialConnectors} />
          </>
        )}
        <RegisterFooter />
        {agreeToTermsPolicy === AgreeToTermsPolicy.Automatic && (
          <TermsAndPrivacyLinks className="mb-4 text-center text-xs text-muted" />
        )}
      </SingleSignOnFormModeContextProvider>
      {/* Hide footer elements when showing Single Sign On form */}
    </LandingPageLayout>
  );
};

export default Register;
