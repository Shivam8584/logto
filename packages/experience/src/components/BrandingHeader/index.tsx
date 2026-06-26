import type { Nullable } from '@silverhand/essentials';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import ConnectIcon from '@/assets/icons/connect-icon.svg?react';
import DynamicT from '@/shared/components/DynamicT';

export type Props = {
  readonly className?: string;
  readonly logo?: Nullable<string>;
  readonly thirdPartyLogo?: Nullable<string>;
  readonly headline?: TFuncKey;
  readonly headlineInterpolation?: Record<string, unknown>;
};

const BrandingHeader = ({
  logo,
  thirdPartyLogo,
  headline,
  headlineInterpolation,
  className,
}: Props) => {
  const shouldShowLogo = Boolean(thirdPartyLogo ?? logo);
  const shouldConnectSvg = Boolean(thirdPartyLogo && logo);
  // A third-party "connect" pair is a relationship visual → keep it centered.
  // A plain headline / single app logo reads as a page heading → left-align it.
  const isConnectPair = shouldConnectSvg;

  return (
    <div
      className={classNames(
        'w-full flex flex-col justify-center mobile:h-[15vh] mobile:min-h-[92px] mobile:max-h-[148px]',
        isConnectPair ? 'items-center' : 'items-start text-left',
        className
      )}
    >
      {shouldShowLogo && (
        <div className="flex items-center mobile:not-last:mb-2 desktop:not-last:mb-3">
          {thirdPartyLogo && (
            <img
              className="h-8 w-auto object-contain object-center"
              alt="third party logo"
              src={thirdPartyLogo}
            />
          )}
          {shouldConnectSvg && <ConnectIcon className="text-line-strong mx-3" />}
          {logo && (
            <img className="h-8 w-auto object-contain object-center" alt="app logo" src={logo} />
          )}
        </div>
      )}

      {headline && (
        <div
          className={classNames(
            'shrink-0 text-ink line-clamp-2 tracking-[-0.018em] mobile:text-2xl mobile:font-semibold desktop:text-xl desktop:font-semibold',
            isConnectPair && 'text-center'
          )}
        >
          <DynamicT forKey={headline} interpolation={headlineInterpolation} />
        </div>
      )}
    </div>
  );
};

export default BrandingHeader;
