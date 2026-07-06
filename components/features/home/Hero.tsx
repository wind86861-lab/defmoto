'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useSiteSettings, DEFAULT_HERO_SLIDES } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

const SLIDE_DURATION = 6000;

export function Hero() {
  const t = useTranslations('home');
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const heroOverride = useSiteSettings((s) => s.hero);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressKey = useRef(0);

  // Admin-managed slides override the defaults (only after hydration).
  const SLIDES =
    mounted && heroOverride.slides && heroOverride.slides.length > 0
      ? heroOverride.slides
      : DEFAULT_HERO_SLIDES;

  // Auto-advance
  useEffect(() => {
    if (paused || reduceMotion || SLIDES.length <= 1) return;
    const id = setTimeout(
      () => setSlide((s) => (s + 1) % SLIDES.length),
      SLIDE_DURATION,
    );
    return () => clearTimeout(id);
  }, [slide, paused, reduceMotion, SLIDES.length]);

  // Re-trigger progress animation on slide change
  useEffect(() => {
    progressKey.current += 1;
  }, [slide]);

  // Slide index can go stale after the admin removes slides — clamp it.
  useEffect(() => {
    if (slide >= SLIDES.length) setSlide(0);
  }, [SLIDES.length, slide]);

  return (
    <section className="relative bg-brand-dark">
      <div className="mx-auto max-w-[1320px] px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
        <div
          className="group relative w-full overflow-hidden rounded-2xl bg-brand-surface shadow-card sm:rounded-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[16/10] sm:aspect-[16/7] lg:aspect-[2.6/1]">
            {/* Hover glow ring — ties the banner into the brand without overpowering admin imagery */}
            <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl ring-1 ring-inset ring-white/8 transition-all duration-500 group-hover:ring-brand-yellow/30 sm:rounded-3xl" />

            {SLIDES.map((s, i) => {
              const isActive = i === slide;
              const image = (
                <img
                  src={s.image}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:object-cover"
                />
              );

              return (
                <motion.div
                  key={s.image + i}
                  className="absolute inset-0"
                  animate={{
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 1.03,
                  }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                >
                  {s.link ? (
                    isExternalLink(s.link) ? (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('heroBannerCta')}
                        className="block h-full w-full cursor-pointer outline-none"
                      >
                        {image}
                      </a>
                    ) : (
                      <Link
                        href={s.link}
                        aria-label={t('heroBannerCta')}
                        className="block h-full w-full cursor-pointer outline-none"
                      >
                        {image}
                      </Link>
                    )
                  ) : (
                    image
                  )}
                </motion.div>
              );
            })}

            {/* Bottom fade keeps pagination legible over any uploaded image */}
            {SLIDES.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/55 to-transparent" />
            )}

            {/* Pagination — progress pills */}
            {SLIDES.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 sm:bottom-4">
                {SLIDES.map((_, i) => {
                  const active = i === slide;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlide(i)}
                      className={cn(
                        'relative h-1.5 overflow-hidden rounded-full transition-all duration-500',
                        active ? 'w-8 bg-white/25' : 'w-1.5 bg-white/40 hover:bg-white/60',
                      )}
                    >
                      {active && (
                        <motion.span
                          key={`progress-${slide}-${progressKey.current}`}
                          className="absolute inset-y-0 left-0 bg-brand-yellow shadow-glow-sm"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={
                            paused || reduceMotion
                              ? { duration: 0 }
                              : { duration: SLIDE_DURATION / 1000, ease: 'linear' }
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
