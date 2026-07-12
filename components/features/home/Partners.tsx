'use client';

import { useTranslations } from 'next-intl';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';

interface Partner {
  name: string;
  tagline: string;
  color: string;
  logo: (props: { className?: string }) => JSX.Element;
}

const partners: Partner[] = [
  {
    name: 'Yamaha',
    tagline: 'Revs Your Heart',
    color: '#E60012',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" />
        <path d="M50 22 L70 70 L60 70 L50 48 L40 70 L30 70 Z M40 70 L60 70" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Honda',
    tagline: 'The Power of Dreams',
    color: '#E60012',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <path d="M16 28 L16 72 L26 72 L26 54 L42 54 L42 72 L52 72 L52 28 L42 28 L42 44 L26 44 L26 28 Z" fill="currentColor" />
        <path d="M58 28 L58 72 L84 72 L84 64 L68 64 L68 54 L82 54 L82 46 L68 46 L68 36 L84 36 L84 28 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Suzuki',
    tagline: 'Way of Life!',
    color: '#0033A0',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <path d="M22 30 L30 30 L42 50 L30 70 L22 70 L34 50 Z" fill="currentColor" />
        <path d="M44 30 L52 30 L64 50 L52 70 L44 70 L56 50 Z" fill="currentColor" />
        <path d="M66 30 L74 30 L78 38 L70 50 L78 70 L70 70 L62 56 L70 44 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Kawasaki',
    tagline: 'Let the good times roll',
    color: '#7CB342',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <path d="M8 50 L50 18 L50 82 Z M50 18 L92 50 L50 50 Z M50 50 L92 50 L50 82 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'KTM',
    tagline: 'Ready to race',
    color: '#FF6600',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <text x="50" y="62" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="26" fill="currentColor" letterSpacing="-1">
          KTM
        </text>
        <path d="M14 72 L86 72" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Ducati',
    tagline: 'Forever Forward',
    color: '#D40000',
    logo: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <ellipse cx="50" cy="50" rx="40" ry="14" stroke="currentColor" strokeWidth="3" fill="none" transform="rotate(-15 50 50)" />
        <text x="50" y="56" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="14" fill="currentColor">
          DUCATI
        </text>
      </svg>
    ),
  },
];

export function Partners() {
  const t = useTranslations('home');
  const mounted = useMounted();
  const adminPartners = useSiteSettings((s) => s.partners);
  const useAdmin = mounted && adminPartners.length > 0;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('partners')}
          </h2>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            Dunyo bo&apos;ylab tanilgan ishlab chiqaruvchilar bilan ishlaymiz
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {useAdmin
            ? adminPartners.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:shadow-card-hover"
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="font-display text-2xl font-extrabold text-brand-yellow">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-display text-base font-extrabold text-white transition-colors group-hover:text-brand-yellow sm:text-lg">
                      {p.name}
                    </div>
                    {p.tagline && (
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{p.tagline}</div>
                    )}
                  </div>
                </div>
              ))
            : partners.map((p) => {
                const Logo = p.logo;
                return (
                  <div
                    key={p.name}
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:shadow-card-hover"
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ color: p.color }}
                    >
                      <Logo className="h-full w-full" />
                    </div>
                    <div className="text-center">
                      <div className="font-display text-base font-extrabold text-white transition-colors group-hover:text-brand-yellow sm:text-lg">
                        {p.name}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{p.tagline}</div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
