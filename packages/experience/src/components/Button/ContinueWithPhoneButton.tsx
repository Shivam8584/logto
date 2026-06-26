import { ExtraParamsKey, SignInIdentifier, experience } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PhoneIcon from '@/assets/icons/factor-phone.svg?react';
import { usePreserveSearchParams } from '@/hooks/use-navigate-with-preserved-search-params';

// Visually identical to SocialLinkButton (same ghost button, 24px leading icon, centred
// label) so "Continue with phone" sits coherently alongside "Continue with Google" etc.
const buttonBaseClass =
  'relative flex flex-row items-center justify-center h-12 px-4 rounded-[11px] cursor-pointer font-medium text-base overflow-hidden select-none appearance-none [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,transform,box-shadow] duration-200 ease-in-out active:not-disabled:scale-[0.985] active:not-disabled:duration-[80ms] desktop:text-[15px]';

type Props = {
  /** `signIn` routes to the phone sign-in first screen, `register` to phone sign-up. */
  readonly mode: 'signIn' | 'register';
  readonly className?: string;
};

/**
 * Routes the user to the focused identifier screen pre-scoped to `phone`, where the
 * country-code selector is always visible and the numeric keyboard opens immediately —
 * instead of relying on the combined smart field to detect "phone" only after typing.
 *
 * The `?identifier=phone` param is read by `useIdentifierParams` /
 * `useIdentifierSignInMethods` to filter the form down to phone only.
 */
const ContinueWithPhoneButton = ({ mode, className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getTo } = usePreserveSearchParams();

  const handleClick = useCallback(() => {
    const path =
      mode === 'signIn' ? experience.routes.identifierSignIn : experience.routes.identifierRegister;

    void navigate(
      getTo({
        pathname: `/${path}`,
        search: new URLSearchParams({
          [ExtraParamsKey.Identifier]: SignInIdentifier.Phone,
        }).toString(),
      })
    );
  }, [getTo, mode, navigate]);

  return (
    <button
      type="button"
      className={classNames(
        buttonBaseClass,
        'btn-ghost w-full',
        'grid grid-cols-[auto_1fr] items-center px-4 gap-3 desktop:hover:not-disabled:not-active:shadow-[inset_0_1px_0_var(--btn-edge),var(--sh-soft)] desktop:hover:not-disabled:not-active:-translate-y-px',
        className
      )}
      onClick={handleClick}
    >
      <PhoneIcon className="w-6 h-6 block shrink-0 text-ink" />
      <span className="text-center leading-5 desktop:leading-4 line-clamp-2">
        {t('action.sign_in_with', { name: t('input.phone_number') })}
      </span>
    </button>
  );
};

export default ContinueWithPhoneButton;
