import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { CatalogClient } from '@/features/catalog/CatalogClient';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

export default function CatalogPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <RoadDashLoader size="lg" label="Katalog yuklanmoqda" />
          </div>
        }
      >
        <CatalogClient />
      </Suspense>
    </PageShell>
  );
}
