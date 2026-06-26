import type { LogtoErrorCode } from '@logto/phrases';
import type { RequestErrorBody } from '@logto/schemas';
import { HTTPError, TimeoutError } from 'ky';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import useToast from './use-toast';

export type ErrorHandlers = {
  [key in LogtoErrorCode]?: (error: RequestErrorBody) => void | Promise<void>;
} & {
  // Overwrite default global error handle logic
  global?: (error: RequestErrorBody) => void | Promise<void>;
};

const useErrorHandler = () => {
  const { t } = useTranslation();
  const { setToast } = useToast();

  const handleError = useCallback(
    async (error: unknown, errorHandlers?: ErrorHandlers) => {
      if (error instanceof HTTPError) {
        try {
          // V2: error body is pre-parsed and available on error.data (response body
          // is already consumed — awaiting error.response.json() would throw).
          // eslint-disable-next-line no-restricted-syntax
          const logtoError = error.data as RequestErrorBody;

          const { code, message } = logtoError;

          const handler = errorHandlers?.[code] ?? errorHandlers?.global;

          if (handler) {
            await handler(logtoError);
          } else {
            setToast(message);
          }

          return;
        } catch (error) {
          setToast(t('error.unknown'));
          console.error(error);

          return;
        }
      }

      if (error instanceof TimeoutError) {
        setToast(t('error.timeout'));

        return;
      }

      setToast(t('error.unknown'));
      console.error(error);
    },
    [setToast, t]
  );

  return handleError;
};

export default useErrorHandler;
