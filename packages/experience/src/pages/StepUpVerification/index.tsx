/**
 * Step-Up Verification page (RFC 9470).
 *
 * Rendered when the OIDC authorization request carries `acr_values=urn:logto:acr:mfa`
 * and the existing session does not yet satisfy the requested ACR.
 *
 * Unlike the regular MFA verification page (which follows a full sign-in flow),
 * this page is shown to an already-authenticated user who only needs to complete
 * an additional factor — no identifier or password step is required.
 *
 * On mount it:
 *   1. Initialises the interaction as a step-up flow (PUT /experience).
 *   2. Attempts an immediate submit. If ACR is satisfied → redirect. Otherwise
 *      the 403 MFA error handler navigates to the correct factor sub-page.
 */

import { LogtoAcrValues } from '@logto/schemas';
import { useEffect } from 'react';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import MfaFactorList from '@/containers/MfaFactorList';
import useMfaFlowState from '@/hooks/use-mfa-factors-state';
import useStepUpAcr from '@/hooks/use-step-up-acr';
import useStepUpVerification from '@/hooks/use-step-up-verification';
import { UserMfaFlow } from '@/types';

const StepUpVerification = () => {
  const { startStepUp } = useStepUpVerification();
  const flowState = useMfaFlowState();
  const stepUpAcr = useStepUpAcr();
  const isPhishingResistant = stepUpAcr === LogtoAcrValues.PhishingResistant;

  useEffect(() => {
    void startStepUp();
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * After `startStepUp` resolves, the MFA error handler navigates to the specific
   * factor sub-page (e.g. `/step-up/totp`). The index page itself acts as the
   * factor selector when multiple factors are available — exactly like MfaVerification.
   */
  if (!flowState) {
    // Still initialising — show nothing (LoadingLayer is handled globally).
    return null;
  }

  return (
    <SecondaryPageLayout
      isNavBarHidden
      description={
        isPhishingResistant ? 'mfa.step_up_phr_description' : 'mfa.step_up_mfa_description'
      }
      /**
       * Hide the nav-bar back button: stepping back abandons the authorization
       * flow entirely, which is confusing. The user should either complete MFA
       * or close the browser tab / cancel from the client app.
       */
      title={isPhishingResistant ? 'mfa.step_up_phr_title' : 'mfa.step_up_mfa_title'}
    >
      <MfaFactorList flow={UserMfaFlow.MfaVerification} flowState={flowState} />
    </SecondaryPageLayout>
  );
};

export default StepUpVerification;
