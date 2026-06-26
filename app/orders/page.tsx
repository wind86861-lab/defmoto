import { PageShell } from '@/components/layout/PageShell';
import { OrdersListClient } from '@/features/orders/OrdersListClient';

export default function OrdersPage() {
  return (
    <PageShell hideFooter>
      <OrdersListClient />
    </PageShell>
  );
}
