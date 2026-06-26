import classNames from 'classnames';

import useConnectors from '@/hooks/use-connectors';
import { LoadingIcon } from '@/shared/components/LoadingLayer';

type Props = {
  readonly className?: string;
  readonly connectorId: string;
  readonly isLoading?: boolean;
};

const SocialLanding = ({ className, connectorId, isLoading = false }: Props) => {
  const { findConnectorById, getConnectorLogo } = useConnectors();
  const result = findConnectorById(connectorId);
  const logoUrl = result ? getConnectorLogo(result) : undefined;

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center w-full mx-auto max-w-[var(--max-w)]',
        className
      )}
    >
      {/* Only render the logo when we actually have a URL, otherwise the <img> shows a
          broken-image glyph on these full-screen redirect pages. */}
      {logoUrl && (
        <div className="mb-4 [&>img]:w-24 [&>img]:h-24 [&>img]:object-contain [&>img]:object-center">
          <img src={logoUrl} alt="logo" />
        </div>
      )}
      {isLoading && <LoadingIcon />}
    </div>
  );
};

export default SocialLanding;
