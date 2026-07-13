'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Clock,
  Send,
  ChevronDown,
  Star,
  Sparkles,
  Briefcase,
  Megaphone,
  GraduationCap,
  Truck,
  Building2,
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
import { mapsHref, telegramHref, telegramLabel } from '@/lib/contactLinks';
import { mockBranches } from '@/mocks/branches';
import type { Branch, FranchiseLocation } from '@/types/content';

export function BranchesClient() {
  const t = useTranslations('branches');
  const mounted = useMounted();
  const storeBranches = useContentStore((s) => s.branches);
  const branches = mounted && storeBranches.length > 0 ? storeBranches : mockBranches;
  const [view, setView] = useState<'branches' | 'franchise'>('branches');
  const [activeId, setActiveId] = useState(mockBranches[0].id);
  const [branchRegion, setBranchRegion] = useState('');

  const branchRegions = useMemo(
    () => Array.from(new Set(branches.map((b) => b.region || b.city).filter(Boolean))) as string[],
    [branches],
  );
  const filteredBranches = branchRegion
    ? branches.filter((b) => (b.region || b.city) === branchRegion)
    : branches;
  const active =
    filteredBranches.find((b) => b.id === activeId) ?? filteredBranches[0] ?? branches[0] ?? mockBranches[0];

  const pickBranchRegion = (r: string) => {
    setBranchRegion(r);
    const first = (r ? branches.filter((b) => (b.region || b.city) === r) : branches)[0];
    if (first) setActiveId(first.id);
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="font-display text-display-md font-extrabold sm:text-display-lg">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">{t('subtitle')}</p>
      </header>

      {/* === Branch / Franchise toggle === */}
      <div className="mx-auto mb-7 flex max-w-md rounded-2xl border border-brand-surface-border bg-brand-surface p-1">
        <TabButton
          active={view === 'branches'}
          onClick={() => setView('branches')}
          icon={<Building2 className="h-4 w-4" />}
          label={t('tabBranches')}
        />
        <TabButton
          active={view === 'franchise'}
          onClick={() => setView('franchise')}
          icon={<Sparkles className="h-4 w-4" />}
          label={t('tabFranchise')}
        />
      </div>

      {view === 'branches' ? (
        <div className="animate-fade-in">
          {/* === Region (viloyat) filter === */}
          {branchRegions.length > 0 && (
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              <RegionChip label={t('allRegions')} active={!branchRegion} onClick={() => pickBranchRegion('')} />
              {branchRegions.map((r) => (
                <RegionChip key={r} label={r} active={branchRegion === r} onClick={() => pickBranchRegion(r)} />
              ))}
            </div>
          )}

          {/* === Branch selector === */}
          <BranchSelector branches={filteredBranches} activeId={active.id} onChange={setActiveId} />

          {/* === Branch detail === */}
          <Reveal direction="up">
            <BranchDetail branch={active} />
          </Reveal>
        </div>
      ) : (
        <div className="animate-fade-in">
          <FranchiseSection />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
        active
          ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm'
          : 'text-white/65 hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BranchSelector({
  branches,
  activeId,
  onChange,
}: {
  branches: Branch[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = branches.find((b) => b.id === activeId);
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
          {branches.map((b) => (
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
  const mapUrl = mapsHref(branch);
  const tgHref = telegramHref(branch.telegram);
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
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-dark/85 px-3 py-2 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-brand-dark"
              >
                <MapPin className="h-3.5 w-3.5 text-brand-yellow" />
                {t('directions')}
              </a>
            )}
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
          {tgHref && (
            <ContactRow
              icon={Send}
              label="Telegram"
              value={telegramLabel(branch.telegram)}
              href={tgHref}
            />
          )}
        </ul>

        {/* RIGHT — Map link */}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand-surface-border bg-gradient-to-br from-brand-surface to-brand-dark lg:aspect-auto lg:h-full"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-yellow/15 blur-3xl" />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/15 text-brand-yellow transition-transform group-hover:scale-110">
              <MapPin className="h-7 w-7" />
            </span>
            <span className="mt-3 font-display text-base font-extrabold">{t('directions')}</span>
            <span className="mt-1 text-xs text-white/55">Google Maps</span>
          </a>
        )}
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
    void fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'branch',
        name: form.name,
        phone: form.phone,
        message: form.message,
        place: branchName,
      }),
    }).catch(() => {});
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

function FrContact({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-2.5 rounded-2xl bg-brand-dark/85 px-4 py-3 backdrop-blur-md">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</div>
        <div className="truncate text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="transition-transform hover:-translate-y-0.5">
      {inner}
    </a>
  ) : (
    inner
  );
}

function FranchiseSection() {
  const t = useTranslations('branches');
  const mounted = useMounted();
  const list = useContentStore((s) => s.franchises);
  const franchises = mounted ? list : [];
  const [region, setRegion] = useState('');

  const regions = useMemo(
    () => Array.from(new Set(franchises.map((f) => f.region).filter(Boolean))) as string[],
    [franchises],
  );
  const filtered = region ? franchises.filter((f) => f.region === region) : franchises;

  if (franchises.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-surface-border py-14 text-center text-sm text-white/50">
        {t('franchiseNone')}
      </p>
    );
  }

  return (
    <section className="space-y-5">
      {/* Region (viloyat) filter */}
      {regions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <RegionChip label={t('allRegions')} active={!region} onClick={() => setRegion('')} />
          {regions.map((r) => (
            <RegionChip key={r} label={r} active={region === r} onClick={() => setRegion(r)} />
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => (
          <FranchiseCard key={f.id} f={f} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-brand-surface-border py-10 text-center text-sm text-white/50">
          {t('franchiseNoneInRegion')}
        </p>
      )}
    </section>
  );
}

function RegionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors',
        active
          ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow shadow-glow-sm'
          : 'border-brand-surface-border bg-brand-surface text-white/70 hover:border-brand-yellow/40 hover:text-brand-yellow',
      )}
    >
      {label}
    </button>
  );
}

function FranchiseCard({ f }: { f: FranchiseLocation }) {
  const location = [f.city, f.address].filter(Boolean).join(', ');
  const map =
    f.mapUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : null);
  const tg = telegramHref(f.telegram);
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface">
      {f.image && (
        <div className="relative h-36 w-full overflow-hidden bg-brand-dark">
          <ProductImage src={f.image} alt={f.name} className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
        </div>
      )}
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-extrabold leading-tight">{f.name}</h3>
          {f.region && (
            <span className="shrink-0 rounded-md bg-brand-yellow/15 px-2 py-0.5 text-[10px] font-bold text-brand-yellow">
              {f.region}
            </span>
          )}
        </div>
        <ul className="space-y-2 text-sm text-white/70">
          {location && (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              {map ? (
                <a href={map} target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow">{location}</a>
              ) : (
                <span>{location}</span>
              )}
            </li>
          )}
          {f.phone && (
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <a href={`tel:${f.phone.replace(/\s/g, '')}`} className="hover:text-brand-yellow">{f.phone}</a>
            </li>
          )}
          {tg && (
            <li className="flex items-start gap-2">
              <Send className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <a href={tg} target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow">{telegramLabel(f.telegram)}</a>
            </li>
          )}
          {f.workingHours && (
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
              <span>{f.workingHours}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
