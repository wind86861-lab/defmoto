'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wrench,
  Phone,
  Clock,
  MapPin,
  Send,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { Reveal } from '@/components/ui/Reveal';
import { YouTubeBlock } from '@/components/ui/YouTubeBlock';
import { ContactRow } from '@/components/ui/ContactRow';
import { OpenStatusBadge } from '@/components/ui/OpenStatusBadge';
import { useHaptic } from '@/hooks/useHaptic';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMounted } from '@/hooks/useMounted';
import { useToast } from '@/components/ui/Toaster';
import { useContentStore } from '@/lib/stores/content';
import { telegramHref, telegramLabel } from '@/lib/contactLinks';
import { formatPrice } from '@/lib/format';
import { mockServiceCenters } from '@/mocks/services';
import type { ServiceCenter, ServiceItem } from '@/types/content';

export function ServiceClient() {
  const t = useTranslations('service');
  const mounted = useMounted();
  const storeCenters = useContentStore((s) => s.serviceCenters);
  const centers = mounted && storeCenters.length > 0 ? storeCenters : mockServiceCenters;
  const [activeId, setActiveId] = useState(mockServiceCenters[0].id);
  const active =
    centers.find((s) => s.id === activeId) ?? centers[0] ?? mockServiceCenters[0];

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="font-display text-display-md font-extrabold sm:text-display-lg">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">
          <span className="font-bold text-white">{centers.length}</span>{' '}
          {t('centers')} · {t('subtitle')}
        </p>
      </header>

      {/* === Center selector === */}
      <CenterSelector centers={centers} activeId={activeId} onChange={setActiveId} />

      {/* === Center detail === */}
      <Reveal direction="left">
        <CenterDetail center={active} />
      </Reveal>
    </div>
  );
}

function CenterSelector({
  centers,
  activeId,
  onChange,
}: {
  centers: ServiceCenter[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = centers.find((s) => s.id === activeId);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div ref={containerRef} className="relative mx-auto mb-8 max-w-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-2 rounded-2xl border bg-brand-surface px-4 transition-colors',
          open
            ? 'border-brand-yellow shadow-glow-sm'
            : 'border-brand-surface-border hover:border-brand-yellow/40',
        )}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-yellow text-brand-dark">
            <Wrench className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span className="truncate">{active?.shortName ?? active?.name}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/55 transition-transform',
            open && 'rotate-180 text-brand-yellow',
          )}
        />
      </button>

      {open && (
        <ul className="absolute inset-x-0 top-[3.25rem] z-30 max-h-72 overflow-y-auto rounded-2xl border border-brand-surface-border bg-brand-surface p-1 shadow-card-hover backdrop-blur-md animate-fade-in">
          {centers.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  s.id === activeId
                    ? 'bg-brand-yellow/15 text-brand-yellow'
                    : 'text-white/80 hover:bg-white/5',
                )}
              >
                <Wrench
                  className={cn(
                    'h-4 w-4',
                    s.id === activeId ? 'text-brand-yellow' : 'text-white/55',
                  )}
                />
                <span className="truncate font-semibold">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CenterDetail({ center }: { center: ServiceCenter }) {
  const t = useTranslations('service');
  const tCommon = useTranslations('common');
  return (
    <div className="space-y-6">
      {/* Equal-height row: header + photo  ⇄  booking form */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="flex flex-col gap-4">
          {/* Header card */}
          <div className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-yellow text-brand-dark shadow-glow-sm">
              <Wrench className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="min-w-0 font-display text-lg font-extrabold sm:text-xl">
              {center.name}
            </h2>
          </div>

          {/* Photo — stretches to match the form's height */}
          {center.image && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-brand-surface-border bg-brand-surface lg:aspect-auto lg:min-h-[220px] lg:flex-1">
              <ProductImage
                src={center.image}
                alt={center.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* RIGHT — booking form */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingForm centerName={center.name} />
        </div>
      </div>

      {/* Contacts ⇄ Services list */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* LEFT — Contacts */}
        <ul className="space-y-2.5 rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
          <ContactRow icon={MapPin} label={t('address')} value={center.address} />
          <ContactRow
            icon={Clock}
            label={t('workingHours')}
            value={center.workingHours}
            extra={<OpenStatusBadge workingHours={center.workingHours} />}
          />
          <ContactRow
            icon={Phone}
            label="Tel"
            value={center.phone}
            href={`tel:${center.phone.replace(/\s/g, '')}`}
            copyable
          />
          {center.secondaryPhone && (
            <ContactRow
              icon={Phone}
              label={tCommon('additionalPhone')}
              value={center.secondaryPhone}
              href={`tel:${center.secondaryPhone.replace(/\s/g, '')}`}
              copyable
            />
          )}
          {telegramHref(center.telegram) && (
            <ContactRow
              icon={Send}
              label="Telegram"
              value={telegramLabel(center.telegram)}
              href={telegramHref(center.telegram)!}
            />
          )}
        </ul>

        {/* RIGHT — Services list */}
        <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">
            {t('servicesList')}
          </h3>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {center.services.map((s) => (
              <ServiceListItem key={s.id} item={s} />
            ))}
          </ul>
        </section>
      </div>

      {/* About full text — full width */}
      {center.about && (
        <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
          <h3 className="mb-2 font-display text-lg font-extrabold">{t('aboutTitle')}</h3>
          <p className="text-sm leading-relaxed text-white/75">{center.about}</p>
        </section>
      )}

      {/* Video (conditional, full width) */}
      <YouTubeBlock url={center.videoUrl} aspect="wide" />
    </div>
  );
}

function ServiceListItem({ item }: { item: ServiceItem }) {
  const t = useTranslations('service');
  return (
    <li className="group rounded-xl border border-brand-surface-border bg-brand-surface p-4 transition-all hover:border-brand-yellow/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-yellow" strokeWidth={3} />
            <h4 className="text-sm font-bold leading-tight">{item.title}</h4>
          </div>
          {item.description && (
            <p className="mt-1 pl-5 text-xs text-white/55">{item.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {item.priceFrom && (
            <div className="font-display text-sm font-extrabold text-brand-yellow">
              {t('from')} {formatPrice(item.priceFrom)}
            </div>
          )}
          {item.duration && (
            <div className="mt-0.5 text-[11px] text-white/45">{item.duration}</div>
          )}
        </div>
      </div>
    </li>
  );
}

function BookingForm({ centerName }: { centerName: string }) {
  const t = useTranslations('service');
  const { notify } = useHaptic();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    comment: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify('success');
    setSubmitted(true);
    void fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'service',
        name: form.name,
        phone: form.phone,
        service: form.service,
        date: form.date,
        message: form.comment,
        place: centerName,
      }),
    }).catch(() => {});
    toast.success(t('bookSuccess'), t('bookSuccessDesc', { centerName }));
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', phone: '', service: '', date: '', comment: '' });
    }, 5000);
  };

  const canSubmit =
    form.name.length >= 2 && form.phone.length >= 9;

  return (
    <div className="rounded-3xl border border-brand-yellow/30 bg-gradient-to-br from-brand-surface to-brand-dark p-5 sm:p-6">
      <h3 className="font-display text-lg font-extrabold sm:text-xl">
        {t('bookTitle')}
      </h3>
      <p className="mt-1 text-xs text-white/65 sm:text-sm">{t('bookDesc')}</p>

      <ul className="mt-4 space-y-1.5 text-xs">
        {[t('bookBenefit1'), t('bookBenefit2'), t('bookBenefit3')].map((s) => (
          <li key={s} className="flex items-center gap-2 text-white/75">
            <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} />
            {s}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Input
          placeholder={t('bookName')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={submitted}
        />
        <Input
          type="tel"
          placeholder={t('bookPhone')}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          disabled={submitted}
        />
        <Input
          placeholder={t('bookService')}
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          disabled={submitted}
        />
        <Input
          type="date"
          style={{ colorScheme: 'dark' }}
          placeholder={t('bookDate')}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          disabled={submitted}
        />
        <textarea
          rows={3}
          placeholder={t('bookComment')}
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          disabled={submitted}
          className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-3 text-base text-white outline-none placeholder:text-white/35 transition-colors focus:border-brand-yellow/60 focus:shadow-glow-sm"
        />
        <Button
          type="submit"
          size="lg"
          glow
          fullWidth
          leftIcon={<Send className="h-4 w-4" />}
          disabled={!canSubmit || submitted}
        >
          {submitted ? '✓ ' + t('bookSuccess') : t('bookSubmit')}
        </Button>
      </form>
    </div>
  );
}
