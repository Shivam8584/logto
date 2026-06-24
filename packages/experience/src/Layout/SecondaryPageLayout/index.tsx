import type { TFuncKey } from 'i18next';
import { type ReactElement } from 'react';

import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import usePlatform from '@/hooks/use-platform';
import DynamicT from '@/shared/components/DynamicT';
import NavBar from '@/shared/components/NavBar';
import PageMeta from '@/shared/components/PageMeta';

import { InlineNotification } from '../../components/Notification';

type Props = {
  readonly title: TFuncKey;
  readonly description?: TFuncKey | ReactElement | '';
  readonly titleProps?: Record<string, unknown>;
  readonly descriptionProps?: Record<string, unknown>;
  readonly notification?: TFuncKey;
  readonly onSkip?: () => void;
  readonly isNavBarHidden?: boolean;
  readonly children: React.ReactNode;
};

const SecondaryPageLayout = ({
  title,
  description,
  titleProps,
  descriptionProps,
  notification,
  onSkip,
  isNavBarHidden,
  children,
}: Props) => {
  const { isMobile } = usePlatform();
  const navigate = useNavigateWithPreservedSearchParams();

  const notificationClass =
    'mobile:-mx-5 mobile:mb-6 desktop:mx-auto desktop:mt-6 desktop:w-full desktop:max-w-[var(--max-w)] desktop:rounded-[13px]';

  return (
    <div className="flex-1 self-stretch">
      <PageMeta titleKey={title} />
      <NavBar
        isHidden={isNavBarHidden}
        onSkip={onSkip}
        onBack={() => {
          navigate(-1);
        }}
      />
      {isMobile && notification && (
        <InlineNotification message={notification} className={notificationClass} />
      )}
      <div className="mx-auto my-2 w-full max-w-[var(--max-w)] animate-[content-enter_0.35s_ease-out_both] desktop:my-12">
        <div className="mb-7 desktop:mb-5">
          <div className="tracking-[-0.022em] text-balance text-ink mobile:text-[26px]/[32px] mobile:font-semibold desktop:text-2xl desktop:font-semibold">
            <DynamicT forKey={title} interpolation={titleProps} />
          </div>
          {description && (
            <div className="mt-2 text-sm text-muted">
              {typeof description === 'string' ? (
                <DynamicT forKey={description} interpolation={descriptionProps} />
              ) : (
                description
              )}
            </div>
          )}
        </div>
        {children}
      </div>
      {!isMobile && notification && (
        <InlineNotification message={notification} className={notificationClass} />
      )}
    </div>
  );
};

export default SecondaryPageLayout;
