import { MfaFactor, experience } from '@logto/schemas';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

import { handleSearchParametersData } from '@/shared/utils/search-parameters';

import AppLayout from './Layout/AppLayout';
import AppBoundary from './Providers/AppBoundary';
import CaptchaContextProvider from './Providers/CaptchaContextProvider';
import ChunkLoadBoundary from './Providers/ChunkLoadBoundary';
import LoadingLayerProvider from './Providers/LoadingLayerProvider';
import PageContextProvider from './Providers/PageContextProvider';
import SettingsProvider from './Providers/SettingsProvider';
import UserInteractionContextProvider from './Providers/UserInteractionContextProvider';
import DevelopmentTenantNotification from './containers/DevelopmentTenantNotification';
// Eager imports below are the first-paint pages (sign-in / register critical path);
// the heavy below-the-fold pages are lazy()-split into the `const` block further down.
import ErrorPage from './pages/ErrorPage';
import ForgotPassword from './pages/ForgotPassword';
import IdentifierRegister from './pages/IdentifierRegister';
import IdentifierSignIn from './pages/IdentifierSignIn';
import Register from './pages/Register';
import RegisterPassword from './pages/RegisterPassword';
import SignIn from './pages/SignIn';
import SignInPassword from './pages/SignInPassword';
import VerificationCode from './pages/VerificationCode';
import { queryClient } from './query-client';
import { LoadingMask } from './shared/components/LoadingLayer';
import { UserMfaFlow } from './types';
import 'overlayscrollbars/overlayscrollbars.css';
import './index.css';

/* ── Lazy: heavy / below-first-paint pages ──
   MFA, consent, device flow, SSO, social, step-up, account-switch etc. Most users
   never reach these, and several are large (WebAuthn, crop, etc.). Code-splitting
   them keeps them out of the initial bundle and loads on demand. */
const Callback = lazy(async () => import('./pages/Callback'));
const Consent = lazy(async () => import('./pages/Consent'));
const Continue = lazy(async () => import('./pages/Continue'));
const Device = lazy(async () => import('./pages/Device'));
const DeviceSuccess = lazy(async () => import('./pages/Device/Success'));
const DirectSignIn = lazy(async () => import('./pages/DirectSignIn'));
const MfaBinding = lazy(async () => import('./pages/MfaBinding'));
const BackupCodeBinding = lazy(async () => import('./pages/MfaBinding/BackupCodeBinding'));
const EmailMfaBinding = lazy(async () => import('./pages/MfaBinding/EmailMfaBinding'));
const PhoneMfaBinding = lazy(async () => import('./pages/MfaBinding/PhoneMfaBinding'));
const TotpBinding = lazy(async () => import('./pages/MfaBinding/TotpBinding'));
const WebAuthnBinding = lazy(async () => import('./pages/MfaBinding/WebAuthnBinding'));
const MfaOnboarding = lazy(async () => import('./pages/MfaOnboarding'));
const MfaVerification = lazy(async () => import('./pages/MfaVerification'));
const BackupCodeVerification = lazy(
  async () => import('./pages/MfaVerification/BackupCodeVerification')
);
const EmailVerificationCode = lazy(
  async () => import('./pages/MfaVerification/EmailVerificationCode')
);
const PhoneVerificationCode = lazy(
  async () => import('./pages/MfaVerification/PhoneVerificationCode')
);
const TotpVerification = lazy(async () => import('./pages/MfaVerification/TotpVerification'));
const WebAuthnVerification = lazy(
  async () => import('./pages/MfaVerification/WebAuthnVerification')
);
const OneTimeToken = lazy(async () => import('./pages/OneTimeToken'));
const OneTimeTokenErrorPage = lazy(async () => import('./pages/OneTimeToken/Error'));
const PasskeySetup = lazy(async () => import('./pages/PasskeySetup'));
const ResetPassword = lazy(async () => import('./pages/ResetPassword'));
const ResetPasswordLanding = lazy(async () => import('./pages/ResetPasswordLanding'));
const SignInPasskeyVerification = lazy(async () => import('./pages/SignInPasskeyVerification'));
const SignInVerificationMethods = lazy(async () => import('./pages/SignInVerificationMethods'));
const SingleSignOnConnectors = lazy(async () => import('./pages/SingleSignOnConnectors'));
const SingleSignOnEmail = lazy(async () => import('./pages/SingleSignOnEmail'));
const SingleSignOnLanding = lazy(async () => import('./pages/SingleSignOnLanding'));
const SocialLanding = lazy(async () => import('./pages/SocialLanding'));
const SocialLinkAccount = lazy(async () => import('./pages/SocialLinkAccount'));
const SocialSignInWebCallback = lazy(async () => import('./pages/SocialSignInWebCallback'));
const Springboard = lazy(async () => import('./pages/Springboard'));
const StepUpVerification = lazy(async () => import('./pages/StepUpVerification'));
const SwitchAccount = lazy(async () => import('./pages/SwitchAccount'));
const UnknownSession = lazy(async () => import('./pages/UnknownSession'));

handleSearchParametersData();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PageContextProvider>
            <SettingsProvider>
              <UserInteractionContextProvider>
                <CaptchaContextProvider>
                  <DevelopmentTenantNotification />
                  <AppBoundary>
                    <ChunkLoadBoundary fallback={<ErrorPage />}>
                      <Suspense fallback={<LoadingMask />}>
                        <Routes>
                          <Route element={<LoadingLayerProvider />}>
                            <Route path="springboard" element={<Springboard />} />
                            <Route path="callback/:connectorId" element={<Callback />} />
                            <Route
                              path="callback/social/:connectorId"
                              element={<SocialSignInWebCallback />}
                            />
                            <Route path="direct/:method/:target?" element={<DirectSignIn />} />
                            <Route
                              path={experience.routes.oneTimeToken}
                              element={<OneTimeToken />}
                            />
                            <Route element={<AppLayout />}>
                              <Route
                                path={`${experience.routes.oneTimeToken}/error`}
                                element={<OneTimeTokenErrorPage />}
                              />
                              <Route
                                path={experience.routes.switchAccount}
                                element={<SwitchAccount />}
                              />
                              <Route path="unknown-session" element={<UnknownSession />} />

                              {/* Sign-in */}
                              <Route path={experience.routes.signIn}>
                                <Route index element={<SignIn />} />
                                <Route path="password" element={<SignInPassword />} />
                                <Route path="passkey" element={<SignInPasskeyVerification />} />
                                <Route
                                  path="verification-methods"
                                  element={<SignInVerificationMethods />}
                                />
                              </Route>

                              {/* Create passkey for sign-in */}
                              <Route path="create-passkey" element={<PasskeySetup />} />

                              {/* Register */}
                              <Route path={experience.routes.register}>
                                <Route index element={<Register />} />
                                <Route path="password" element={<RegisterPassword />} />
                              </Route>

                              {/* Forgot password */}
                              <Route path="forgot-password">
                                <Route index element={<ForgotPassword />} />
                                <Route path="reset" element={<ResetPassword />} />
                              </Route>

                              {/* Passwordless verification code */}
                              <Route
                                path=":flow/verification-code"
                                element={<VerificationCode />}
                              />

                              {/* Mfa onboarding page. Prompt users to turn on 2-step verification. */}
                              <Route path="mfa-onboarding" element={<MfaOnboarding />} />

                              {/* Mfa binding */}
                              <Route path={UserMfaFlow.MfaBinding}>
                                <Route index element={<MfaBinding />} />
                                <Route path={MfaFactor.TOTP} element={<TotpBinding />} />
                                <Route path={MfaFactor.WebAuthn} element={<WebAuthnBinding />} />
                                <Route
                                  path={MfaFactor.BackupCode}
                                  element={<BackupCodeBinding />}
                                />
                                <Route
                                  path={MfaFactor.EmailVerificationCode}
                                  element={<EmailMfaBinding />}
                                />
                                <Route
                                  path={MfaFactor.PhoneVerificationCode}
                                  element={<PhoneMfaBinding />}
                                />
                              </Route>

                              {/* Mfa verification */}
                              <Route path={UserMfaFlow.MfaVerification}>
                                <Route index element={<MfaVerification />} />
                                <Route path={MfaFactor.TOTP} element={<TotpVerification />} />
                                <Route
                                  path={MfaFactor.WebAuthn}
                                  element={<WebAuthnVerification />}
                                />
                                <Route
                                  path={MfaFactor.BackupCode}
                                  element={<BackupCodeVerification />}
                                />
                                <Route
                                  path={MfaFactor.EmailVerificationCode}
                                  element={<EmailVerificationCode />}
                                />
                                <Route
                                  path={MfaFactor.PhoneVerificationCode}
                                  element={<PhoneVerificationCode />}
                                />
                              </Route>

                              {/* Step-up verification (RFC 9470): shown when an already-authenticated
                              user must satisfy a higher ACR (e.g. MFA) to access a resource.
                              Reuses the existing MFA verification sub-routes via index redirect. */}
                              <Route path="step-up">
                                <Route index element={<StepUpVerification />} />
                                <Route path={MfaFactor.TOTP} element={<TotpVerification />} />
                                <Route
                                  path={MfaFactor.WebAuthn}
                                  element={<WebAuthnVerification />}
                                />
                                <Route
                                  path={MfaFactor.BackupCode}
                                  element={<BackupCodeVerification />}
                                />
                                <Route
                                  path={MfaFactor.EmailVerificationCode}
                                  element={<EmailVerificationCode />}
                                />
                                <Route
                                  path={MfaFactor.PhoneVerificationCode}
                                  element={<PhoneVerificationCode />}
                                />
                              </Route>

                              {/* Continue set up missing profile */}
                              <Route path="continue">
                                <Route path=":method" element={<Continue />} />
                              </Route>

                              {/* Social sign-in pages */}
                              <Route path="social">
                                <Route path="link/:connectorId" element={<SocialLinkAccount />} />
                                <Route path="landing/:connectorId" element={<SocialLanding />} />
                              </Route>

                              {/* Single sign-on */}
                              <Route path={experience.routes.sso}>
                                {/* Single sign-on first screen landing page */}
                                <Route index element={<SingleSignOnLanding />} />
                                <Route path="email" element={<SingleSignOnEmail />} />
                                <Route path="connectors" element={<SingleSignOnConnectors />} />
                              </Route>

                              {/* Consent */}
                              <Route path="consent" element={<Consent />} />

                              {/* Device flow */}
                              <Route path={experience.routes.device} element={<Device />} />
                              <Route
                                path={`${experience.routes.device}/success`}
                                element={<DeviceSuccess />}
                              />

                              {/*
                               * Identifier sign-in (first screen)
                               * The first screen which only display specific identifier-based sign-in methods to users
                               */}
                              <Route
                                path={experience.routes.identifierSignIn}
                                element={<IdentifierSignIn />}
                              />

                              {/*
                               * Identifier register (first screen)
                               * The first screen which only display specific identifier-based registration methods to users
                               */}
                              <Route
                                path={experience.routes.identifierRegister}
                                element={<IdentifierRegister />}
                              />

                              {/*
                               * Reset password (first screen)
                               * The first screen which allow users to directly access the password reset page
                               */}
                              <Route
                                path={experience.routes.resetPassword}
                                element={<ResetPasswordLanding />}
                              />
                              <Route path="*" element={<ErrorPage />} />
                            </Route>
                          </Route>
                        </Routes>
                      </Suspense>
                    </ChunkLoadBoundary>
                  </AppBoundary>
                </CaptchaContextProvider>
              </UserInteractionContextProvider>
            </SettingsProvider>
          </PageContextProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
