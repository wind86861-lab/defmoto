import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { ProductPageClient } from '@/features/product/ProductPageClient';
import { mockProducts } from '@/mocks/products';

export function generateStaticParams() {
  return mockProducts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = mockProducts.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description ?? p.name,
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = mockProducts.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const similar = mockProducts
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 4);

  return (
    <PageShell hideFooter>
      <ProductPageClient product={product} similar={similar} />
    </PageShell>
  );
}
