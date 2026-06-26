'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Clock, ArrowRight, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProductImage } from '@/components/ui/ProductImage';
import { Reveal } from '@/components/ui/Reveal';
import { formatDate } from '@/lib/format';
import { mockBlogPosts } from '@/mocks/blog';
import type { BlogCategory, BlogPost } from '@/types/content';

export function BlogListClient() {
  const t = useTranslations('blog');
  const [filter, setFilter] = useState<BlogCategory | 'all'>('all');

  const categories: { key: BlogCategory | 'all'; label: string }[] = [
    { key: 'all', label: t('categoryAll') },
    { key: 'news', label: t('categoryNews') },
    { key: 'tips', label: t('categoryTips') },
    { key: 'reviews', label: t('categoryReviews') },
    { key: 'promotion', label: t('categoryPromotion') },
  ];

  const posts = useMemo(() => {
    if (filter === 'all') return mockBlogPosts;
    return mockBlogPosts.filter((p) => p.category === filter);
  }, [filter]);

  const promo = mockBlogPosts.find((p) => p.isPromotion);

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-display text-display-md font-extrabold sm:text-display-lg">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">{t('subtitle')}</p>
      </header>

      {/* Featured promotion banner */}
      {filter === 'all' && promo && (
        <Reveal direction="left">
          <PromoBanner post={promo} />
        </Reveal>
      )}

      {/* Category filter */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {categories.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors touch-feedback',
                  active
                    ? 'border-brand-yellow bg-brand-yellow text-brand-dark shadow-glow-sm'
                    : 'border-brand-surface-border bg-brand-surface text-white/75 hover:border-brand-yellow/40 hover:text-white',
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <Reveal direction="right" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </Reveal>

      {posts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-brand-surface-border py-16 text-center">
          <p className="text-sm text-white/55">{t('noPostsInCategory')}</p>
        </div>
      )}
    </div>
  );
}

function PromoBanner({ post }: { post: BlogPost }) {
  const t = useTranslations('blog');

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative mb-8 block overflow-hidden rounded-3xl border border-brand-yellow/40 bg-gradient-to-br from-brand-surface to-brand-dark"
    >
      <div className="grid items-stretch sm:grid-cols-2">
        <div className="relative h-56 overflow-hidden sm:h-auto">
          <ProductImage
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="h-full w-full"
          />
          {post.promotionBadge && (
            <span className="absolute left-4 top-4 rounded-full bg-gradient-yellow px-3 py-1 font-display text-base font-extrabold text-brand-dark shadow-glow">
              {post.promotionBadge}
            </span>
          )}
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-yellow">
            {t('promoLabel')}
          </span>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
            {post.excerpt}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-yellow">
            {t('readMore')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const t = useTranslations('blog');

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-yellow/40 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-dark">
        <ProductImage
          src={post.cover}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackClassName="h-full w-full"
        />
        {post.isPromotion && post.promotionBadge && (
          <span className="absolute left-3 top-3 rounded-md bg-gradient-yellow px-2 py-1 text-xs font-bold text-brand-dark shadow-glow-sm">
            {post.promotionBadge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          <Tag className="h-3 w-3 text-brand-yellow" />
          <span>{t(`category${capitalize(post.category)}` as never)}</span>
          <span>·</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-base font-extrabold leading-tight sm:text-lg">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-white/55">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
          <span className="flex items-center gap-1 text-white/45">
            <Clock className="h-3 w-3" />
            {post.readMinutes} {t('minRead')}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-brand-yellow">
            {t('readMore')}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
