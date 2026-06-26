import { PageShell } from '@/components/layout/PageShell';
import { ServiceClient } from '@/features/service/ServiceClient';

export default function ServicePage() {
  return (
    <PageShell>
      <ServiceClient />
    </PageShell>
  );
}
