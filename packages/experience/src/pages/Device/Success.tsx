import { CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

import StaticPageLayout from '@/Layout/StaticPageLayout';
import PageMeta from '@/shared/components/PageMeta';

const Success = () => {
  const { t } = useTranslation();

  return (
    <StaticPageLayout>
      <PageMeta titleKey="description.device_activation_success" />
      <div className="flex flex-1 flex-col items-center justify-center w-[min(100%,400px)] text-center">
        <div className="relative mb-4 grid place-items-center">
          <div
            className="scene-glow pointer-events-none absolute inset-0 rounded-full blur-[40px]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--success) 36%, transparent), transparent 66%)',
            }}
            aria-hidden="true"
          />
          <div className="scene-pop relative flex items-center justify-center w-20 h-20 rounded-full bg-success text-white shadow-[var(--sh-float)]">
            <CheckIcon className="w-12 h-12" />
          </div>
        </div>
        <div className="mb-2 text-lg font-semibold text-ink">
          {t('description.device_activation_success')}
        </div>
        <div className="text-muted text-sm">
          {t('description.device_activation_success_description')}
        </div>
      </div>
    </StaticPageLayout>
  );
};

export default Success;
