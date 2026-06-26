import { getTranslations } from 'next-intl/server';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

// Default Next.js loading UI shown for every route segment that
// suspends during a server-side render. Brand-consistent moto loader.
export default async function RootLoading() {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <RoadDashLoader size="xl" label={t('loading')} />
    </div>
  );
}
