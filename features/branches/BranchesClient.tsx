'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Send,
  ChevronDown,
  Star,
  Sparkles,
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
import { useToast } from '@/components/ui/Toaster';
import { mockBranches } from '@/mocks/branches';
import type { Branch } from '@/types/content';

export function BranchesClient() {
  const t = useTranslations('branches');
  const [activeId, setActiveId] = useState(mockBranches[0].id);
  const active = mockBranches.find((b) => b.id === activeId) ?? mockBranches[0];

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="font-display text-display-md font-extrabold sm:text-display-lg">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">{t('subtitle')}</p>
      </header>

      {/* === Branch selector === */}
      <BranchSelector activeId={activeId} onChange={setActiveId} />

      {/* === Branch detail === */}
      <Reveal direction="left">
        <BranchDetail branch={active} />
      </Reveal>

      {/* === Franchise block (kept) === */}
      <Reveal direction="right">
        <FranchiseSection />
      </Reveal>
    </div>
  );
}

function BranchSelector({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = mockBranches.find((b) => b.id === activeId);
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
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-yellow text-xs text-brand-dark">
            №{active?.number}
          </span>
          <span className="truncate">{active?.name.replace(/^Filial №\d+\s*—\s*/, '')}</span>
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
          {mockBranches.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  b.id === activeId
                    ? 'bg-brand-yellow/15 text-brand-yellow'
                    : 'text-white/80 hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold',
                    b.id === activeId
                      ? 'bg-gradient-yellow text-brand-dark'
                      : 'bg-brand-surface-elevated text-white/55',
                  )}
                >
                  №{b.number}
                </span>
                <span className="truncate font-semibold">{b.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BranchDetail({ branch }: { branch: Branch }) {
  const t = useTranslations('branches');
  const tCommon = useTranslations('common');
  const mapUrl = `https://yandex.uz/maps/?pt=${branch.lng},${branch.lat}&z=15&l=map`;
  const fullAddress = branch.address.startsWith(branch.city)
    ? branch.address
    : `${branch.city}, ${branch.address}`;

  return (
    <div className="space-y-6">
      {/* Equal-height row: header + photo  ⇄  request form */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* LEFT — header + photo */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-yellow font-display text-sm font-extrabold text-brand-dark shadow-glow-sm">
                  №{branch.number}
                </span>
                {branch.isHeadOffice && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
                    <Star className="h-3 w-3 fill-brand-yellow" />
                    {t('headOffice')}
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-display text-xl font-extrabold leading-tight sm:text-2xl">
                {branch.legalName ?? branch.name}
              </h2>
              {branch.director && (
                <p className="mt-1.5 text-xs text-white/55">
                  <span className="font-bold text-white/85">{t('directorLabel')}: </span>
                  {branch.director}
                </p>
              )}
            </div>
          </div>

          {/* Photo + "On map" button — stretches to match the form's height */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-brand-surface-border bg-brand-surface lg:aspect-auto lg:min-h-[260px] lg:flex-1">
            {branch.image && (
              <ProductImage
                src={branch.image}
                alt={branch.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-dark/85 px-3 py-2 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-brand-dark"
            >
              <MapPin className="h-3.5 w-3.5 text-brand-yellow" />
              {t('directions')}
            </a>
          </div>
        </div>

        {/* RIGHT — request form */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RequestForm branchName={branch.name} />
        </div>
      </div>

      {/* Contacts ⇄ Map */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* LEFT — Contacts */}
        <ul className="space-y-2.5 rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
          <ContactRow icon={MapPin} label={t('address')} value={fullAddress} />
          <ContactRow
            icon={Clock}
            label={t('workingHours')}
            value={branch.workingHours}
            extra={<OpenStatusBadge workingHours={branch.workingHours} />}
          />
          <ContactRow
            icon={Phone}
            label="Tel"
            value={branch.phone}
            href={`tel:${branch.phone.replace(/\s/g, '')}`}
            copyable
          />
          {branch.secondaryPhone && (
            <ContactRow
              icon={Phone}
              label={tCommon('additionalPhone')}
              value={branch.secondaryPhone}
              href={`tel:${branch.secondaryPhone.replace(/\s/g, '')}`}
              copyable
            />
          )}
          {branch.email && (
            <ContactRow
              icon={Mail}
              label="Email"
              value={branch.email}
              href={`mailto:${branch.email}`}
              copyable
            />
          )}
        </ul>

        {/* RIGHT — Map */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface lg:aspect-auto lg:h-full">
          <iframe
            src={`https://yandex.uz/map-widget/v1/?ll=${branch.lng}%2C${branch.lat}&z=15&pt=${branch.lng},${branch.lat},pm2rdm`}
            title={t('address')}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-dark/85 px-3 py-2 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-brand-dark"
          >
            <MapPin className="h-3.5 w-3.5 text-brand-yellow" />
            {t('directions')}
          </a>
        </div>
      </div>

      {/* YouTube — conditional, full width */}
      <YouTubeBlock url={branch.videoUrl} aspect="wide" />
    </div>
  );
}

function RequestForm({ branchName }: { branchName: string }) {
  const t = useTranslations('branches');
  const { notify } = useHaptic();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify('success');
    setSubmitted(true);
    toast.success(
      t('requestSuccessTitle'),
      t('requestSuccessDesc', { branchName }),
    );
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', phone: '', message: '' });
    }, 4000);
  };

  const canSubmit = form.name.length >= 2 && form.phone.length >= 9;

  return (
    <div className="rounded-3xl border border-brand-surface-border bg-brand-surface p-5 sm:p-6">
      <h3 className="font-display text-lg font-extrabold sm:text-xl">
        {t('requestTitle')}
      </h3>
      <p className="mt-1 text-xs text-white/55 sm:text-sm">{t('requestDesc')}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Field label={t('requestNameLabel')}>
          <Input
            placeholder={t('franchiseName')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={submitted}
          />
        </Field>
        <Field label={t('requestPhoneLabel')}>
          <Input
            type="tel"
            placeholder={t('franchisePhone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={submitted}
          />
        </Field>
        <Field label={t('requestMessageLabel')}>
          <textarea
            rows={3}
            placeholder={t('requestMessagePlaceholder')}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            disabled={submitted}
            className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none placeholder:text-white/35 transition-colors focus:border-brand-yellow/60 focus:shadow-glow-sm"
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          glow
          fullWidth
          leftIcon={<Send className="h-4 w-4" />}
          disabled={!canSubmit || submitted}
        >
          {submitted ? `✓ ${t('sentLabel')}` : t('requestSubmit')}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function FranchiseSection() {
  const t = useTranslations('branches');
  const { notify } = useHaptic();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    budget: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify('success');
    setSubmitted(true);
    toast.success(t('franchiseSuccessTitle'), t('franchiseSuccessDesc'));
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', phone: '', city: '', budget: '', message: '' });
    }, 5000);
  };

  const canSubmit =
    form.name.length >= 2 && form.phone.length >= 9 && form.city.length >= 2;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-yellow p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid gap-6 sm:grid-cols-2 sm:gap-10">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-dark/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              {t('franchiseBadge')}
            </div>
            <h2 className="font-display text-display-sm font-extrabold leading-tight text-brand-dark sm:text-display-md">
              {t('franchiseTitle')}
            </h2>
            <p className="mt-3 text-sm font-medium text-brand-dark/80 sm:text-base">
              {t('franchiseDesc')}
            </p>

            {!open && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-dark px-5 font-bold text-white shadow-card transition-all hover:bg-black hover:shadow-card-hover active:scale-[0.98]"
              >
                {t('franchiseSubmit')}
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {open && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 rounded-2xl bg-brand-dark/85 p-4 backdrop-blur-md animate-slide-up sm:p-5"
            >
              <Input
                placeholder={t('franchiseName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitted}
              />
              <Input
                type="tel"
                placeholder={t('franchisePhone')}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={submitted}
              />
              <Input
                placeholder={t('franchiseCity')}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={submitted}
              />
              <Input
                placeholder={t('franchiseBudget')}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                disabled={submitted}
              />
              <textarea
                rows={3}
                placeholder={t('franchiseMessage')}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                disabled={submitted}
                className="rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-3 text-base text-white outline-none placeholder:text-white/35 transition-colors focus:border-brand-yellow/60 focus:shadow-glow-sm"
              />
              <Button
                type="submit"
                size="lg"
                glow
                fullWidth
                leftIcon={<Send className="h-4 w-4" />}
                disabled={!canSubmit || submitted}
              >
                {submitted ? `✓ ${t('sentLabel')}` : t('franchiseSubmit')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
