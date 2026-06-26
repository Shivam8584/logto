import { experience, type RequestErrorBody } from '@logto/schemas';
import { useCallback, useMemo } from 'react';

import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';

import { usePromiseConfirmModal } from './use-confirm-modal';
import { type ErrorHandlers } from './use-error-handler';

/**
 * Handles the "your interaction session went away" class of errors that can
 * surface when an interaction is submitted after a delay — most notably a social
 * registration where the user lingered on the terms-of-use modal long enough for
 * the backend verification record to expire (`session.verification_session_not_found`).
 *
 * Without this the error falls through to the global toast while the page is
 * stuck behind the just-dismissed modal, which reads as a dead end. Instead we
 * surface a clear alert and restart the hosted sign-in flow so the user can try
 * again with a fresh session.
 */
const useSessionExpiredErrorHandler = (): ErrorHandlers => {
  const navigate = useNavigateWithPreservedSearchParams();
  const { show } = usePromiseConfirmModal();

  const errorCallback = useCallback(
    async (error: RequestErrorBody) => {
      await show({
        type: 'alert',
        ModalContent: error.message,
        cancelText: 'action.got_it',
      });
      // The session is gone; send the user back to a fresh sign-in rather than
      // leaving them on a half-completed interaction.
      navigate('/' + experience.routes.signIn, { replace: true });
    },
    [navigate, show]
  );

  return useMemo<ErrorHandlers>(
    () => ({
      'session.verification_session_not_found': errorCallback,
      'session.connector_session_not_found': errorCallback,
      'session.connector_validation_session_not_found': errorCallback,
      'session.interaction_not_found': errorCallback,
      'session.identifier_not_found': errorCallback,
      'session.verification_expired': errorCallback,
    }),
    [errorCallback]
  );
};

export default useSessionExpiredErrorHandler;
