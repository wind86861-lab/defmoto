import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/ui/Reveal';
import { Hero } from '@/components/features/home/Hero';
import { PopularCategories } from '@/components/features/home/PopularCategories';
import { ProductShowcase } from '@/components/features/home/ProductShowcase';
import { Advantages } from '@/components/features/home/Advantages';
import { AboutCompany } from '@/components/features/home/AboutCompany';
import { NotFoundRequest } from '@/components/features/home/NotFoundRequest';
import { Partners } from '@/components/features/home/Partners';
import { Reviews } from '@/components/features/home/Reviews';
import { FaqBlock } from '@/components/features/home/FaqBlock';
import { DemoBadge } from '@/components/features/DemoBadge';
import { mockProducts, bestsellers } from '@/mocks/products';
import { popularCategories } from '@/mocks/categories';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0">
        <Hero />

        <Reveal direction="left">
          <PopularCategories categories={popularCategories} />
        </Reveal>

        <Reveal direction="right">
          <ProductShowcase
            title={t('popularProducts')}
            href="/catalog"
            products={mockProducts.slice(0, 6)}
          />
        </Reveal>

        <Reveal direction="left">
          <Advantages />
        </Reveal>

        <Reveal direction="right">
          <ProductShowcase
            title={t('bestsellersTitle')}
            subtitle={t('bestsellersSub')}
            href="/catalog?sort=bestseller"
            hrefLabel={t('allProducts')}
            products={bestsellers}
            accent
          />
        </Reveal>

        <Reveal direction="left">
          <AboutCompany />
        </Reveal>
        <Reveal direction="right">
          <NotFoundRequest />
        </Reveal>
        <Reveal direction="left">
          <Partners />
        </Reveal>
        <Reveal direction="right">
          <Reviews />
        </Reveal>
        <Reveal direction="left">
          <FaqBlock />
        </Reveal>
      </main>
      <Footer />
      <BottomNav />
      <DemoBadge />
    </>
  );
}
