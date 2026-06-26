import { getTranslations } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

export default async function BlogLoading() {
  const t = await getTranslations('common');
  return (
    <PageShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <RoadDashLoader size="lg" label={t('loadingBlog')} />
      </div>
    </PageShell>
  );
}
