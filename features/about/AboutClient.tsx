'use client';

import { useLocale, useTranslations } from 'next-intl';
import { trText, trOf } from '@/lib/i18nField';
import { Award, ShieldCheck, Wrench, Tag, Check } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { YouTubeBlock } from '@/components/ui/YouTubeBlock';
import { ProductImage } from '@/components/ui/ProductImage';
import { useContentStore } from '@/lib/stores/content';
import { useMounted } from '@/hooks/useMounted';

const ABOUT_PHOTO =
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=85';
const ABOUT_VIDEO = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

export function AboutClient() {
  const t = useTranslations('about');
  const locale = useLocale();
  const mounted = useMounted();
  const about = useContentStore((s) => s.about);

  // Admin-editable content with i18n fallback (only after hydration).
  const a = mounted ? about : {};
  const videoUrl = a.videoUrl?.trim() || ABOUT_VIDEO;
  const photo = a.photo?.trim() || ABOUT_PHOTO;
  const heading = trText(a.title, a.tr, 'title', locale).trim() || t('aboutHeading');
  const introText = trText(a.intro, a.tr, 'intro', locale);
  const introParas = introText.trim()
    ? introText.trim().split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    : [t('aboutIntroP1'), t('aboutIntroP2')];
  const stats = a.stats?.length
    ? a.stats
    : [
        { value: '5+', label: t('statBranches') },
        { value: '10K+', label: t('statProducts') },
        { value: '5K+', label: t('statCustomers') },
        { value: '24/7', label: t('statSupport') },
      ];

  const values = [
    { icon: Award, title: t('valueQuality'), desc: t('valueQualityDesc') },
    { icon: ShieldCheck, title: t('valueReliability'), desc: t('valueReliabilityDesc') },
    { icon: Wrench, title: t('valueProfessionalism'), desc: t('valueProfessionalismDesc') },
    { icon: Tag, title: t('valueAccessibility'), desc: t('valueAccessibilityDesc') },
  ];

  const why = [
    { title: t('whyTitle1'), desc: t('whyDesc1') },
    { title: t('whyTitle2'), desc: t('whyDesc2') },
    { title: t('whyTitle3'), desc: t('whyDesc3') },
    { title: t('whyTitle4'), desc: t('whyDesc4') },
  ];

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <h1 className="sr-only">{t('title')}</h1>

      {/* === Video === */}
      <Reveal direction="up">
        <YouTubeBlock url={videoUrl} title={t('videoTitle')} />
      </Reveal>

      {/* === About the company === */}
      <Reveal direction="left" className="mt-10">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-brand-surface-border bg-brand-surface lg:aspect-square">
            <ProductImage
              src={photo}
              alt={heading}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
              {heading}
            </h2>
            {introParas.map((para, i) => (
              <p key={i} className={`${i === 0 ? 'mt-4' : 'mt-3'} text-base leading-relaxed text-white/65`}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </Reveal>

      {/* === History === */}
      <Reveal direction="right" className="mt-14 max-w-3xl sm:mt-20">
        <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
          {t('history')}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/65">{t('historyP1')}</p>
        <p className="mt-3 text-base leading-relaxed text-white/65">{t('historyP2')}</p>
      </Reveal>

      {/* === Values === */}
      <Reveal direction="left" className="mt-14 sm:mt-20">
        <h2 className="mb-8 font-display text-display-sm font-extrabold sm:text-display-md">
          {t('valuesTitle')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-display text-base font-extrabold">
                  <Icon className="h-4 w-4 text-brand-yellow" />
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* === Stats === */}
      <Reveal direction="right" className="mt-14">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-brand-yellow/25 bg-gradient-to-br from-brand-surface to-brand-dark p-6 text-center"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-yellow/15 blur-2xl" />
              <div className="relative">
                <div className="font-display text-display-lg font-extrabold text-gradient-yellow">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-white/60">
                  {trOf(s, 'label', locale)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* === Why choose us === */}
      <Reveal direction="left" className="mt-14 sm:mt-20">
        <h2 className="mb-8 font-display text-display-sm font-extrabold sm:text-display-md">
          {t('whyTitle')}
        </h2>
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {why.map(({ title, desc }, i) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-brand-surface-border bg-brand-surface p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-sm font-extrabold text-brand-dark shadow-glow-sm">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-extrabold leading-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
