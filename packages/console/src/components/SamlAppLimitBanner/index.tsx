type Props = {
  readonly variant: 'inline' | 'footer';
  readonly limit: number;
  readonly className?: string;
};

/**
 * Hypedrive ships the self-hosted build with no cloud upsells. Upstream this banner
 * shows an OSS SAML app-limit notice that links out to Logto's pricing page, so it is
 * stubbed to render nothing here. Kept as a component (returning `null`, never
 * `undefined`) so existing call sites and props stay valid.
 */
function SamlAppLimitBanner(_props: Props) {
  return null;
}

export default SamlAppLimitBanner;
