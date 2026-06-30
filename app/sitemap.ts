import type { MetadataRoute } from 'next';
import { getProductsServer, getCategoriesServer } from '@/lib/serverContent';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://45.80.70.107';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/catalog', '/branches', '/service', '/about', '/blog'].map(
    (p) => ({
      url: `${BASE}${p}`,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
    }),
  );

  const products = getProductsServer().map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const categories = getCategoriesServer().map((c) => ({
    url: `${BASE}/catalog?category=${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...products, ...categories];
}
