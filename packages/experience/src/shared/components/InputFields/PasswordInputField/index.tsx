import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { Nullable } from '@silverhand/essentials';
import type { KeyboardEvent, Ref } from 'react';
import { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconButton from '@/shared/components/IconButton';

import InputField from '../InputField';
import type { Props as InputFieldProps } from '../InputField';

type Props = Omit<InputFieldProps, 'type' | 'suffix' | 'isSuffixFocusVisible'>;

const PasswordInputField = (props: Props, forwardRef: Ref<Nullable<HTMLInputElement>>) => {
  const { t } = useTranslation();
  const { onKeyUp, onKeyDown, onBlur } = props;
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const innerRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(forwardRef, () => innerRef.current);

  const detectCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(event.getModifierState('CapsLock'));
  };

  return (
    <div className="contents">
      <InputField
        isSuffixFocusVisible
        type={showPassword ? 'text' : 'password'}
        suffix={
          <IconButton
            onMouseDown={(event) => {
              event.preventDefault();
              setShowPassword((previous) => !previous);
            }}
          >
            {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
          </IconButton>
        }
        {...props}
        ref={innerRef}
        onKeyUp={(event) => {
          detectCapsLock(event);
          return onKeyUp?.(event);
        }}
        onKeyDown={(event) => {
          detectCapsLock(event);
          return onKeyDown?.(event);
        }}
        onBlur={(event) => {
          setIsCapsLockOn(false);
          return onBlur?.(event);
        }}
      />
      {isCapsLockOn && (
        <div
          className="text-sm text-[var(--color-alert-70)] pt-1 mb-3 ms-0.5"
          role="status"
          aria-live="polite"
        >
          {t('input.caps_lock_on')}
        </div>
      )}
    </div>
  );
};

export default forwardRef(PasswordInputField);
