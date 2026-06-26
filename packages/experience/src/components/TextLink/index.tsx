import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import { useMemo } from 'react';
import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { useIframeModal } from '@/Providers/IframeModalProvider';
import { usePreserveSearchParams } from '@/hooks/use-navigate-with-preserved-search-params';
import usePlatform from '@/hooks/use-platform';
import DynamicT from '@/shared/components/DynamicT';

const linkClass =
  'cursor-pointer [-webkit-tap-highlight-color:transparent] inline-flex justify-center [text-underline-offset:2px] transition-colors duration-200 ease-in-out rounded motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-overlay-brand-focused,var(--primary))] [&>svg]:me-2';

const typeClass = {
  primary:
    'text-sm font-medium text-primary no-underline active:text-primary-hover desktop:hover:text-primary-hover',
  secondary:
    'text-ink font-[inherit] no-underline desktop:hover:text-primary desktop:active:text-primary',
} as const;

export type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly text?: TFuncKey;
  readonly icon?: ReactNode;
  readonly type?: 'primary' | 'secondary';
} & Partial<LinkProps>;

const TextLink = ({ className, children, text, icon, type = 'primary', to, ...rest }: Props) => {
  const { t } = useTranslation();
  const { getTo } = usePreserveSearchParams();
  const { isMobile } = usePlatform();
  const { setModalState } = useIframeModal();

  // By default the behavior of opening a new window is not supported in WkWebView, or in android webview.
  // Hijack the hyperlink props and open the link in an iframe modal instead.
  const hyperLinkProps = useMemo(() => {
    const { href, target, onClick, ...others } = rest;

    // Keep the original behavior if the link is not external.
    if (!href || target !== '_blank') {
      return rest;
    }

    return {
      href,
      target,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (isMobile) {
          const title = text && t(text);
          event.preventDefault();
          setModalState({ href, title: typeof title === 'string' ? title : undefined });
        }

        onClick?.(event);
      },
      ...others,
    };
  }, [isMobile, rest, setModalState, t, text]);

  if (to) {
    return (
      <Link className={classNames(linkClass, typeClass[type], className)} to={getTo(to)} {...rest}>
        {icon}
        {children ?? <DynamicT forKey={text} />}
      </Link>
    );
  }

  return (
    <a
      className={classNames(linkClass, typeClass[type], className)}
      {...hyperLinkProps}
      rel="noopener"
    >
      {icon}
      {children ?? <DynamicT forKey={text} />}
    </a>
  );
};

export default TextLink;
