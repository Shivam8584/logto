import { ReservedPlanId } from '@logto/schemas';
import { useContext, useMemo } from 'react';

import { isCloud } from '@/consts/env';
import { SubscriptionDataContext } from '@/contexts/SubscriptionDataProvider';
import { isPaidPlan } from '@/utils/subscription';

const usePaywall = () => {
  const {
    currentSubscription: { planId, isEnterprisePlan },
  } = useContext(SubscriptionDataContext);

  // Self-hosted has no plan tiers or quotas (see the OSS bypass in
  // `SubscriptionDataProvider/utils.ts`), so nothing is ever gated as "free tier" — every
  // feature is unlocked. Keeping this `false` off-cloud stops the Security forms from
  // disabling real features behind a paywall that doesn't exist here.
  const isFreeTenant = isCloud && planId === ReservedPlanId.Free;
  const isPaidTenant = isPaidPlan(planId, isEnterprisePlan);

  return useMemo(
    () => ({
      isFreeTenant,
      isPaidTenant,
    }),
    [isFreeTenant, isPaidTenant]
  );
};

export default usePaywall;
