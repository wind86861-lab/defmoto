import { PageShell } from '@/components/layout/PageShell';
import { CheckoutClient } from '@/features/checkout/CheckoutClient';

export default function CheckoutPage() {
  return (
    <PageShell hideFooter>
      <CheckoutClient />
    </PageShell>
  );
}
