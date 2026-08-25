import type { Product } from '@/types/product';

// Demo/seed products have been removed — the shop's catalogue lives entirely in
// admin-managed content (the `content-store` blob, served via serverContent /
// the content store). This stays an empty array so the few modules that still
// import it (types, fallbacks) keep compiling without shipping any demo data.
export const mockProducts: Product[] = [];

export const bestsellers = mockProducts.filter((p) => p.isBestseller);
export const newArrivals = mockProducts.filter((p) => p.isNew);
