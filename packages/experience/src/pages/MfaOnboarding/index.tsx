import { useCallback, useState } from 'react';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import MfaScene from '@/components/illustrations/MfaScene';
import useEnableMfa from '@/hooks/use-enable-mfa';
import useSkipMfa from '@/hooks/use-skip-mfa';
import Button from '@/shared/components/Button';

const MfaOnboarding = () => {
  const skipMfa = useSkipMfa();
  const enableMfa = useEnableMfa();

  // Both Enable and Skip kick off an async request + redirect; guard against
  // double-taps firing a duplicate request against an already-advanced interaction.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnable = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await enableMfa();
    } finally {
      setIsSubmitting(false);
    }
  }, [enableMfa, isSubmitting]);

  const handleSkip = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await skipMfa();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, skipMfa]);

  return (
    <SecondaryPageLayout
      title="mfa.onboarding"
      description="mfa.onboarding_description"
      onSkip={handleSkip}
    >
      <MfaScene />
      <Button
        type="primary"
        title="mfa.enable_mfa"
        isLoading={isSubmitting}
        onClick={handleEnable}
      />
    </SecondaryPageLayout>
  );
};

export default MfaOnboarding;
