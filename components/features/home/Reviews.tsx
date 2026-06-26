'use client';

import { useTranslations } from 'next-intl';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 'r1',
    author: 'Sardor M.',
    role: 'Mototsikl xaridori',
    rating: 5,
    date: '15 mart 2026',
    text: "Juda zo'r mahsulot! Tezda yetkazib berishdi, qadog'i mukammal. Bozordan ancha arzon, qulay narx.",
  },
  {
    id: 'r2',
    author: 'Aziz K.',
    role: 'Sport-bayker',
    rating: 5,
    date: '10 mart 2026',
    text: "Sifat yaxshi, professional yondashuv. Servis xizmati ham juda chiroyli. Tavsiya qilaman.",
  },
  {
    id: 'r3',
    author: 'Bobur T.',
    role: 'Doimiy mijoz',
    rating: 5,
    date: '5 mart 2026',
    text: "Filialdan olib ketdim, xodimlar juda do'st. Tovarni tekshirish imkoniyati ham bor.",
  },
  {
    id: 'r4',
    author: 'Dilshod R.',
    role: 'Yangi mijoz',
    rating: 5,
    date: '2 mart 2026',
    text: "Birinchi marta sotib oldim. Narx, sifat, xizmat — uchchalasi ham yuqori darajada.",
  },
];

export function Reviews() {
  const t = useTranslations('home');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('reviews')}
          </h2>
          <p className="mt-2 text-sm text-white/55 sm:text-base">{t('reviewsSub')}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="group relative overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:shadow-card-hover"
            >
              {/* Quote glyph */}
              <Quote
                className="absolute right-3 top-3 h-8 w-8 text-brand-yellow/15 transition-colors group-hover:text-brand-yellow/30"
                strokeWidth={1.5}
              />

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < r.rating
                        ? 'h-4 w-4 fill-brand-yellow text-brand-yellow'
                        : 'h-4 w-4 text-white/20'
                    }
                  />
                ))}
              </div>

              {/* Text */}
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-white/75">
                {r.text}
              </p>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3 border-t border-brand-surface-border pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-base font-extrabold text-brand-dark">
                  {r.author[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.author}</p>
                  <p className="truncate text-[11px] text-white/45">
                    {r.role} · {r.date}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
