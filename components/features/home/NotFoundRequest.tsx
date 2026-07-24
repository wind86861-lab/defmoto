'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { formatUzPhone } from '@/lib/phoneInput';
import { useHaptic } from '@/hooks/useHaptic';

/** Real Uzbek phone: 9 local digits, optionally with a 998 prefix. */
function isValidUzPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 9 || (digits.length === 12 && digits.startsWith('998'));
}

export function NotFoundRequest() {
  const t = useTranslations('home');
  const { notify } = useHaptic();
  const [product, setProduct] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (product.trim().length < 3) {
      setError(t('notFoundErrProduct'));
      return;
    }
    if (!isValidUzPhone(phone)) {
      setError(t('notFoundErrPhone'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product', product: product.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        notify('success');
        setSubmitted(true);
        setProduct('');
        setPhone('');
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(data?.error === 'invalid-phone' ? t('notFoundErrPhone') : t('notFoundErrGeneric'));
      }
    } catch {
      setError(t('notFoundErrGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-yellow p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-6 sm:grid-cols-5 sm:gap-8">
            <div className="sm:col-span-3">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-dark/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark backdrop-blur-md">
                <Search className="h-3 w-3" />
                {t('notFoundBadge')}
              </div>
              <h2 className="font-display text-display-md font-extrabold leading-tight text-brand-dark sm:text-display-lg">
                {t('notFoundTitle')}
              </h2>
              <p className="mt-2 text-sm font-medium text-brand-dark/75 sm:text-base">
                {t('notFoundSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:col-span-2 sm:justify-center">
              <Input
                placeholder={t('notFoundProductPlaceholder')}
                className="bg-brand-dark/90 text-white placeholder:text-white/40"
                value={product}
                onChange={(e) => setProduct(e.target.value.slice(0, 120))}
                maxLength={120}
                disabled={submitting || submitted}
              />
              <Input
                placeholder={t('notFoundPhonePlaceholder')}
                type="tel"
                inputMode="tel"
                maxLength={17}
                className="bg-brand-dark/90 text-white placeholder:text-white/40"
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                disabled={submitting || submitted}
              />
              {error && (
                <p className="rounded-lg bg-brand-dark/85 px-3 py-2 text-xs font-bold text-red-400">
                  ⚠️ {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || submitted}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 font-bold text-white shadow-card transition-all hover:bg-black hover:shadow-card-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-success disabled:text-white"
              >
                {submitted ? (
                  <>✓ {t('notFoundSent')}</>
                ) : submitting ? (
                  <>…</>
                ) : (
                  <>
                    <span>{t('notFoundCta')}</span>
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
