import { PageShell } from '@/components/layout/PageShell';
import { CartClient } from '@/features/cart/CartClient';

export default function CartPage() {
  return (
    <PageShell hideFooter>
      <CartClient />
    </PageShell>
  );
}
