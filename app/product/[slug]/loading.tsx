import { getTranslations } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

export default async function ProductLoading() {
  const t = await getTranslations('common');
  return (
    <PageShell hideFooter>
      <div className="flex min-h-[70vh] items-center justify-center">
        <RoadDashLoader size="lg" label={t('loadingProduct')} />
      </div>
    </PageShell>
  );
}
