import { getTranslations } from 'next-intl/server';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

export default async function AdminLoading() {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <RoadDashLoader size="lg" label={t('loadingAdmin')} />
    </div>
  );
}
