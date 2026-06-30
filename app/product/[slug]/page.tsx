import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { ProductPageClient } from '@/features/product/ProductPageClient';
import {
  getProductBySlugServer,
  getSimilarProductsServer,
} from '@/lib/serverContent';

// Read from the DB on each request so admin edits / new products are reflected.
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getProductBySlugServer(params.slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description ?? p.name,
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlugServer(params.slug);
  if (!product) notFound();

  const similar = getSimilarProductsServer(product, 4);

  return (
    <PageShell hideFooter>
      <ProductPageClient product={product} similar={similar} />
    </PageShell>
  );
}
