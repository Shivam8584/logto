/**
 * Provides a hook to access the session storage.
 */
import { useCallback } from 'react';
import { z } from 'zod';

import {
  identifierInputValueGuard,
  ssoConnectorMetadataGuard,
  verificationIdsMapGuard,
} from '@/types/guard';

const logtoStorageKeyPrefix = `logto:${window.location.origin}`;

export enum StorageKeys {
  SsoEmail = 'sso-email',
  SsoConnectors = 'sso-connectors',
  IdentifierInputValue = 'identifier-input-value',
  ForgotPasswordIdentifierInputValue = 'forgot-password-identifier-input-value',
  verificationIds = 'verification-ids',
}

const valueGuard = Object.freeze({
  [StorageKeys.SsoEmail]: z.string(),
  [StorageKeys.SsoConnectors]: z.array(ssoConnectorMetadataGuard),
  [StorageKeys.IdentifierInputValue]: identifierInputValueGuard,
  [StorageKeys.ForgotPasswordIdentifierInputValue]: identifierInputValueGuard,
  [StorageKeys.verificationIds]: verificationIdsMapGuard,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the per-guard output type is irrelevant here
} satisfies { [key in StorageKeys]: z.ZodType<any> });

type StorageValueType<K extends StorageKeys> = z.infer<(typeof valueGuard)[K]>;

const useSessionStorage = () => {
  const set = useCallback(<T extends StorageKeys>(key: T, value: StorageValueType<T>) => {
    if (typeof value === 'object') {
      sessionStorage.setItem(`${logtoStorageKeyPrefix}:${key}`, JSON.stringify(value));
      return;
    }

    sessionStorage.setItem(`${logtoStorageKeyPrefix}:${key}`, value);
  }, []);

  const remove = useCallback((key: StorageKeys) => {
    sessionStorage.removeItem(`${logtoStorageKeyPrefix}:${key}`);
  }, []);

  const get = useCallback(
    <T extends StorageKeys>(key: T): StorageValueType<T> | undefined => {
      const value = sessionStorage.getItem(`${logtoStorageKeyPrefix}:${key}`);

      if (value === null) {
        return;
      }

      const { error, data: rawValue } = valueGuard[key].safeParse(
        (() => {
          try {
            // eslint-disable-next-line no-restricted-syntax
            return JSON.parse(value) as unknown;
          } catch {
            return value;
          }
        })()
      );

      if (error) {
        // Clear the invalid value
        remove(key);
        return;
      }

      // `valueGuard[key]` is indexed by the generic `T`, so zod infers the parsed value as the union
      // of every guard's output. The guard for `key` validated the matching shape at runtime, so we
      // assert the per-key type here.
      // eslint-disable-next-line no-restricted-syntax
      return rawValue as StorageValueType<T>;
    },
    [remove]
  );

  return { set, get, remove };
};

export default useSessionStorage;
