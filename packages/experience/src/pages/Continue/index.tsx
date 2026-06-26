import { MissingProfile } from '@logto/schemas';
import { useLocation, useParams } from 'react-router-dom';

import ErrorPage from '@/pages/ErrorPage';
import { continueFlowStateGuard } from '@/types/guard';

import SetEmailOrPhone from './SetEmailOrPhone';
import SetExtraProfile from './SetExtraProfile';
import SetPassword from './SetPassword';
import SetUsername from './SetUsername';

type Parameters = {
  method?: string;
};

const Continue = () => {
  const { method = '' } = useParams<Parameters>();
  const { state } = useLocation();

  const { data: continueFlowState } = continueFlowStateGuard.safeParse(state);

  if (!continueFlowState) {
    return <ErrorPage title="error.invalid_session" />;
  }

  const { interactionEvent } = continueFlowState;

  if (method === MissingProfile.password) {
    return <SetPassword interactionEvent={interactionEvent} />;
  }

  if (method === MissingProfile.username) {
    return <SetUsername interactionEvent={interactionEvent} />;
  }

  if (
    method === MissingProfile.email ||
    method === MissingProfile.phone ||
    method === MissingProfile.emailOrPhone
  ) {
    return <SetEmailOrPhone missingProfile={method} interactionEvent={interactionEvent} />;
  }

  if (method === 'extra-profile') {
    return <SetExtraProfile interactionEvent={interactionEvent} />;
  }

  return <ErrorPage />;
};

export default Continue;
