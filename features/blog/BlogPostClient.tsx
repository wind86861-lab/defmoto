'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Clock, Tag, Send, ArrowRight } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';
import { YouTubeBlock } from '@/components/ui/YouTubeBlock';
import { useHaptic } from '@/hooks/useHaptic';
import { useMounted } from '@/hooks/useMounted';
import { useContentStore } from '@/lib/stores/content';
import { formatDate } from '@/lib/format';
import type { BlogPost } from '@/types/content';

interface Props {
  slug: string;
  fallbackPost: BlogPost | null;
  fallbackRelated: BlogPost[];
}

export function BlogPostClient({ slug, fallbackPost, fallbackRelated }: Props) {
  const t = useTranslations('blog');
  const { impact } = useHaptic();
  const mounted = useMounted();
  const storePosts = useContentStore((s) => s.blogPosts);

  // Prefer the live admin post; fall back to the server-rendered (mock) one.
  const post = (mounted ? storePosts.find((p) => p.slug === slug) : null) || fallbackPost;
  const related = post
    ? mounted && storePosts.length
      ? storePosts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3)
      : fallbackRelated
    : [];

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-white/55">{t('notFound')}</p>
        <Link href="/blog" className="mt-4 inline-block text-brand-yellow hover:underline">
          {t('backToBlog')}
        </Link>
      </div>
    );
  }

  const share = async () => {
    impact('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
    }
  };

  // Long-form mock body if not provided
  const body =
    post.body ||
    `${post.excerpt}\n\nDEFT MOTO sizning ishonchli hamkoringizdir. Bizning mutaxassislarimiz har bir mijoz uchun individual yondashuvni qo'llaydi va eng yaxshi yechimni taklif qiladi.\n\nQo'shimcha ma'lumot uchun servis chat orqali murojaat qiling yoki eng yaqin filialga tashrif buyuring.`;

  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:py-10">
      {/* Back link */}
      <Link
        href="/blog"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-brand-yellow"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      {/* Meta */}
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/45">
        <Tag className="h-3 w-3 text-brand-yellow" />
        <span>{t(`category${capitalize(post.category)}` as never)}</span>
        <span>·</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.readMinutes} {t('minRead')}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-display text-display-md font-extrabold leading-tight sm:text-display-lg">
        {post.title}
      </h1>

      {/* Author */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-yellow font-display text-sm font-extrabold text-brand-dark">
          {post.author[0]}
        </div>
        <div>
          <p className="text-sm font-bold">{post.author}</p>
          <p className="text-[11px] text-white/45">DEFT MOTO redaksiya</p>
        </div>
      </div>

      {/* Cover */}
      <div className="mt-6 aspect-[16/9] overflow-hidden rounded-3xl border border-brand-surface-border bg-brand-surface">
        <ProductImage
          src={post.cover}
          alt={post.title}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
        />
      </div>

      {/* Optional video — hidden if no url */}
      {post.videoUrl && (
        <div className="mt-6">
          <YouTubeBlock url={post.videoUrl} />
        </div>
      )}

      {/* Body */}
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-white/80">
        {body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Share */}
      <div className="mt-10 flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface px-4 py-3">
        <span className="text-sm font-semibold text-white/65">{t('shareTitle')}</span>
        <button
          type="button"
          onClick={share}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-yellow/15 px-3 py-1.5 text-xs font-bold text-brand-yellow transition-colors hover:bg-brand-yellow/25"
        >
          <Send className="h-3.5 w-3.5" />
          Telegram
        </button>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 font-display text-display-sm font-extrabold">
            {t('related')}
          </h2>
          <ul className="space-y-3">
            {related.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-3 transition-all hover:border-brand-yellow/40 hover:shadow-card-hover"
                >
                  <ProductImage
                    src={p.cover}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-xl object-cover"
                    fallbackClassName="h-16 w-24 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold">{p.title}</h3>
                    <p className="mt-1 text-[11px] text-white/45">
                      {p.readMinutes} {t('minRead')}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
