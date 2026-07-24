'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Globe, ChevronRight } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useHaptic } from '@/hooks/useHaptic';
import { locales, localeNames, type Locale } from '@/i18n/config';

const COOKIE_NAME = 'NEXT_LOCALE';

export function LanguageSwitcher({ variant = 'row' }: { variant?: 'row' | 'icon' }) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { selection } = useHaptic();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectLocale = (next: Locale) => {
    if (next === locale) {
      setOpen(false);
      return;
    }
    selection();
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          aria-label={t('languageLabel')}
          onClick={() => {
            selection();
            setOpen(true);
          }}
          className="group flex h-10 items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-2.5 text-white/80 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow touch-feedback xl:h-11 xl:px-3"
        >
          <Globe className="h-4 w-4 text-white/55 transition-colors group-hover:text-brand-yellow" />
          <span className="text-xs font-bold uppercase">{locale}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            selection();
            setOpen(true);
          }}
          className="group flex w-full items-center gap-3 rounded-xl border border-brand-surface-border bg-brand-surface px-4 py-3 text-left transition-colors hover:border-brand-yellow/40 touch-feedback"
        >
          <Globe className="h-4 w-4 text-white/55 transition-colors group-hover:text-brand-yellow" />
          <span className="flex-1 text-sm font-semibold">{t('languageLabel')}</span>
          <span className="text-xs text-white/45">
            {locale.toUpperCase()} · {localeNames[locale]}
          </span>
          <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t('languageSheetTitle')}>
        <div className="space-y-1.5 p-4">
          {locales.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                disabled={isPending}
                onClick={() => selectLocale(l)}
                className="flex w-full items-center gap-3 rounded-xl border border-brand-surface-border bg-brand-dark/40 px-4 py-3 text-left transition-colors disabled:opacity-60"
                style={active ? { borderColor: 'rgba(255,184,0,0.5)' } : undefined}
              >
                <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-brand-surface text-[11px] font-black uppercase text-brand-yellow">
                  {l}
                </span>
                <span className="flex-1 text-sm font-semibold">{localeNames[l]}</span>
                {active && <Check className="h-4 w-4 text-brand-yellow" />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
