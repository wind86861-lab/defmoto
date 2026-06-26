import { PageShell } from '@/components/layout/PageShell';
import { WishlistClient } from '@/features/wishlist/WishlistClient';

export default function WishlistPage() {
  return (
    <PageShell hideFooter>
      <WishlistClient />
    </PageShell>
  );
}
