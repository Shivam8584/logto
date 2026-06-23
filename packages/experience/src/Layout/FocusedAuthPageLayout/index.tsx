import { type AgreeToTermsPolicy } from '@logto/schemas';
import classNames from 'classnames';
import { type TFuncKey } from 'i18next';
import { useContext, useMemo, type ReactNode } from 'react';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import BrandingHeader from '@/components/BrandingHeader';
import type { Props as TextLinkProps } from '@/components/TextLink';
import TextLink from '@/components/TextLink';
import TermsAndPrivacyLinks from '@/containers/TermsAndPrivacyLinks';
import useTerms from '@/hooks/use-terms';
import type { Props as PageMetaProps } from '@/shared/components/PageMeta';
import { getBrandingLogoUrl } from '@/shared/utils/logo';
import { layoutClassNames } from '@/utils/consts';

import FirstScreenLayout from '../FirstScreenLayout';

type Props = {
  readonly children: ReactNode;
  readonly pageMeta: PageMetaProps;
  readonly title: TFuncKey;
  readonly description: string;
  readonly footerTermsDisplayPolicies?: AgreeToTermsPolicy[];
  readonly authOptionsLink: TextLinkProps;
};

/**
 * FocusedAuthPageLayout Component
 *
 * This layout component is designed for focused authentication pages that serve as the first screen
 * for specific auth methods, such as identifier sign-in, identifier-register, and single sign-on landing pages.
 */
const FocusedAuthPageLayout = ({
  children,
  pageMeta,
  title,
  description,
  footerTermsDisplayPolicies = [],
  authOptionsLink,
}: Props) => {
  const { agreeToTermsPolicy } = useTerms();
  const { experienceSettings, theme } = useContext(PageContext);

  const shouldDisplayFooterTerms = useMemo(
    () => agreeToTermsPolicy && footerTermsDisplayPolicies.includes(agreeToTermsPolicy),
    [agreeToTermsPolicy, footerTermsDisplayPolicies]
  );

  const logo = experienceSettings
    ? getBrandingLogoUrl({
        theme,
        branding: experienceSettings.branding,
        isDarkModeEnabled: experienceSettings.color.isDarkModeEnabled,
      })
    : undefined;

  return (
    <FirstScreenLayout pageMeta={pageMeta}>
      {/* Render the brand logo (+ title as headline) like LandingPageLayout — the focused
          identifier screens (e.g. "Continue with phone") were missing the logo entirely. */}
      <BrandingHeader
        className={classNames(
          'mobile:mt-3 mobile:pb-6 desktop:mb-6',
          layoutClassNames.brandingHeader
        )}
        headline={title}
        logo={logo}
      />
      <div className="mb-7 -mt-2 text-sm text-muted">{description}</div>
      {children}
      {shouldDisplayFooterTerms && (
        <TermsAndPrivacyLinks className="mt-4 text-center text-xs text-muted" />
      )}
      <TextLink {...authOptionsLink} className="mt-7" />
    </FirstScreenLayout>
  );
};

export default FocusedAuthPageLayout;
