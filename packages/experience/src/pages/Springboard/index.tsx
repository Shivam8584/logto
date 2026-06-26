import { experience } from '@logto/schemas';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import LoadingLayer from '@/shared/components/LoadingLayer';
import { storeCallbackLink, storeState } from '@/utils/social-connectors';

const Springboard = () => {
  const [searchParameters] = useSearchParams();
  const navigate = useNavigateWithPreservedSearchParams();

  useEffect(() => {
    const state = searchParameters.get('state');
    const connectorId = searchParameters.get('connectorId');
    const callback = searchParameters.get('callback');
    const redirectTo = searchParameters.get('redirectTo');

    if (callback && connectorId) {
      storeCallbackLink(connectorId, callback);
    }

    if (state && connectorId) {
      storeState(state, connectorId);
    }

    if (redirectTo) {
      window.location.assign(redirectTo);
      return;
    }

    // No redirect target (malformed / expired bounce) — don't strand the user on
    // a forever spinner; send them to a fresh sign-in.
    navigate('/' + experience.routes.signIn, { replace: true });
  }, [navigate, searchParameters]);

  return <LoadingLayer />;
};

export default Springboard;
