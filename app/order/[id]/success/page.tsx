import { PageShell } from '@/components/layout/PageShell';
import { OrderSuccessClient } from '@/features/orders/OrderSuccessClient';

export default function OrderSuccessPage({ params }: { params: { id: string } }) {
  return (
    <PageShell hideFooter>
      <OrderSuccessClient id={params.id} />
    </PageShell>
  );
}
