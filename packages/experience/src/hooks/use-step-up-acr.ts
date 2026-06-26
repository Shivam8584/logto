/**
 * Detect whether the current interaction is a step-up authentication request
 * (RFC 9470) by reading the `step_up_acr` search parameter injected by the
 * OIDC server's `interactions.url` builder when `acr_values` was present in
 * the authorization request and the existing session does not satisfy it.
 */

import { ExtraParamsKey, LogtoAcrValues, type LogtoAcrValue } from '@logto/schemas';
import { useSearchParams } from 'react-router-dom';

const knownAcrValues = new Set<string>(Object.values(LogtoAcrValues));

const useStepUpAcr = (): LogtoAcrValue | undefined => {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get(ExtraParamsKey.StepUpAcr);

  if (raw && knownAcrValues.has(raw)) {
    // eslint-disable-next-line no-restricted-syntax
    return raw as LogtoAcrValue;
  }

  return undefined;
};

export default useStepUpAcr;
