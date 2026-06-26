import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useDebouncedLoader } from 'use-debounced-loader';

import RotatingRingIcon from '@/shared/components/Button/RotatingRingIcon';

const buttonBaseClass =
  'relative flex flex-row items-center justify-center h-12 px-4 rounded-[11px] cursor-pointer font-medium text-base overflow-hidden select-none appearance-none [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,transform,box-shadow] duration-200 ease-in-out active:not-disabled:scale-[0.985] active:not-disabled:duration-[80ms] desktop:text-[15px]';
const buttonDisabledClass = 'opacity-100 [&]:cursor-not-allowed';

export type Props = {
  readonly isDisabled?: boolean;
  readonly isLoading?: boolean;
  readonly className?: string;
  // Part of the public button API and passed by callers (e.g. SSO connector name); not rendered directly.
  // eslint-disable-next-line react/no-unused-prop-types
  readonly target: string;
  readonly logo: string;
  readonly name: Record<string, string>;
  readonly onClick?: () => void;
};

const SocialLinkButton = ({
  isDisabled,
  isLoading = false,
  className,
  name,
  logo,
  onClick,
}: Props) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const localName = name[language] ?? name.en;

  const isLoadingActive = useDebouncedLoader(isLoading, 300);

  return (
    <button
      disabled={isDisabled}
      className={classNames(
        buttonBaseClass,
        'btn-ghost',
        'w-full',
        'grid grid-cols-[auto_1fr] items-center px-4 gap-3 desktop:hover:not-disabled:not-active:shadow-[inset_0_1px_0_var(--btn-edge),var(--sh-soft)] desktop:hover:not-disabled:not-active:-translate-y-px',
        (isDisabled ?? isLoadingActive) && buttonDisabledClass,
        className
      )}
      type="button"
      onClick={onClick}
    >
      {logo && !isLoadingActive && (
        <img src={logo} alt="" className="w-6 h-6 block shrink-0 overflow-hidden object-contain" />
      )}
      {isLoadingActive && (
        <span className="block px-[1.5px] text-0 leading-none text-[var(--color-brand-loading)]">
          <RotatingRingIcon />
        </span>
      )}
      <span className="text-center leading-5 desktop:leading-4 line-clamp-2">
        {t('action.sign_in_with', { name: localName })}
      </span>
    </button>
  );
};

export default SocialLinkButton;
