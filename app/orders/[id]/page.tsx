import { PageShell } from '@/components/layout/PageShell';
import { OrderDetailClient } from '@/features/orders/OrderDetailClient';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageShell hideFooter>
      <OrderDetailClient id={params.id} />
    </PageShell>
  );
}
