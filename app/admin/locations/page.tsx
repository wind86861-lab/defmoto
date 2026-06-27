'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Building2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useContentStore } from '@/lib/stores/content';
import type { Branch, ServiceCenter, ServiceItem } from '@/types/content';

type Tab = 'branches' | 'service' | 'franchise';

export default function AdminLocationsPage() {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<Tab>('branches');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
          {t('navLocations')}
        </h1>
        <p className="mt-1 text-sm text-white/55">{t('locSubtitle')}</p>
      </header>

      <div className="flex max-w-lg rounded-2xl border border-brand-surface-border bg-brand-surface p-1">
        <TabBtn active={tab === 'branches'} onClick={() => setTab('branches')} icon={<Building2 className="h-4 w-4" />} label={t('locTabBranches')} />
        <TabBtn active={tab === 'service'} onClick={() => setTab('service')} icon={<Wrench className="h-4 w-4" />} label={t('locTabService')} />
        <TabBtn active={tab === 'franchise'} onClick={() => setTab('franchise')} icon={<Sparkles className="h-4 w-4" />} label={t('locTabFranchise')} />
      </div>

      {tab === 'branches' && <BranchesTab />}
      {tab === 'service' && <ServiceTab />}
      {tab === 'franchise' && <FranchiseTab />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all',
        active ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm' : 'text-white/65 hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ============================ Branches ============================ */

function BranchesTab() {
  const t = useTranslations('admin');
  const { impact, notify } = useHaptic();
  const mounted = useMounted();
  const branches = useContentStore((s) => s.branches);
  const add = useContentStore((s) => s.addBranch);
  const reset = useContentStore((s) => s.resetBranches);
  const list = mounted ? branches : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
          {t('locBranchesCount', { count: list.length })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { if (confirm(t('resetConfirmText'))) { reset(); notify('warning'); } }}>
            {t('resetButton')}
          </Button>
          <button
            type="button"
            onClick={() => {
              impact('light');
              add({
                id: `b_${Date.now()}`,
                number: list.length + 1,
                name: '',
                address: '',
                city: '',
                phone: '',
                workingHours: '',
                lat: 41.3111,
                lng: 69.2797,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addBranchBtn')}
          </button>
        </div>
      </div>

      {list.map((b, i) => (
        <BranchCard key={b.id} branch={b} index={i} total={list.length} />
      ))}
    </section>
  );
}

function BranchCard({ branch, index, total }: { branch: Branch; index: number; total: number }) {
  const t = useTranslations('admin');
  const update = useContentStore((s) => s.updateBranch);
  const remove = useContentStore((s) => s.removeBranch);
  const reorder = useContentStore((s) => s.reorderBranch);
  const set = (patch: Partial<Branch>) => update(branch.id, patch);

  return (
    <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm font-extrabold">
          №{branch.number} · {branch.name || t('fldName')}
        </span>
        <RowActions index={index} total={total} onUp={() => reorder(branch.id, -1)} onDown={() => reorder(branch.id, 1)} onRemove={() => { if (confirm(t('locDeleteConfirm'))) remove(branch.id); }} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <F label={t('fldName')}><Input value={branch.name} onChange={(e) => set({ name: e.target.value })} /></F>
        <F label={t('fldNumber')}><Input type="number" value={String(branch.number)} onChange={(e) => set({ number: Number(e.target.value) || 0 })} /></F>
        <F label={t('fldLegalName')}><Input value={branch.legalName ?? ''} onChange={(e) => set({ legalName: e.target.value })} /></F>
        <F label={t('fldDirector')}><Input value={branch.director ?? ''} onChange={(e) => set({ director: e.target.value })} /></F>
        <F label={t('fldCity')}><Input value={branch.city} onChange={(e) => set({ city: e.target.value })} /></F>
        <F label={t('fldAddress')}><Input value={branch.address} onChange={(e) => set({ address: e.target.value })} /></F>
        <F label={t('fldPhone')}><Input value={branch.phone} onChange={(e) => set({ phone: e.target.value })} /></F>
        <F label={t('fldSecondaryPhone')}><Input value={branch.secondaryPhone ?? ''} onChange={(e) => set({ secondaryPhone: e.target.value })} /></F>
        <F label={t('fldEmail')}><Input value={branch.email ?? ''} onChange={(e) => set({ email: e.target.value })} /></F>
        <F label={t('fldHours')}><Input value={branch.workingHours} onChange={(e) => set({ workingHours: e.target.value })} /></F>
        <F label={t('fldImage')} full><Input value={branch.image ?? ''} onChange={(e) => set({ image: e.target.value })} /></F>
        <F label={t('fldLat')}><Input value={String(branch.lat)} onChange={(e) => set({ lat: Number(e.target.value) || 0 })} /></F>
        <F label={t('fldLng')}><Input value={String(branch.lng)} onChange={(e) => set({ lng: Number(e.target.value) || 0 })} /></F>
        <F label={t('fldVideo')} full><Input value={branch.videoUrl ?? ''} onChange={(e) => set({ videoUrl: e.target.value })} /></F>
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={Boolean(branch.isHeadOffice)} onChange={(e) => set({ isHeadOffice: e.target.checked })} className="h-4 w-4 cursor-pointer accent-brand-yellow" />
        {t('fldHeadOffice')}
      </label>
    </article>
  );
}

/* ============================ Service ============================ */

function ServiceTab() {
  const t = useTranslations('admin');
  const { impact, notify } = useHaptic();
  const mounted = useMounted();
  const centers = useContentStore((s) => s.serviceCenters);
  const add = useContentStore((s) => s.addServiceCenter);
  const reset = useContentStore((s) => s.resetServiceCenters);
  const list = mounted ? centers : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
          {t('locServiceCount', { count: list.length })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { if (confirm(t('resetConfirmText'))) { reset(); notify('warning'); } }}>
            {t('resetButton')}
          </Button>
          <button
            type="button"
            onClick={() => { impact('light'); add({ id: `s_${Date.now()}`, name: '', address: '', phone: '', workingHours: '', services: [] }); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addServiceBtn')}
          </button>
        </div>
      </div>

      {list.map((c, i) => (
        <ServiceCard key={c.id} center={c} index={i} total={list.length} />
      ))}
    </section>
  );
}

function ServiceCard({ center, index, total }: { center: ServiceCenter; index: number; total: number }) {
  const t = useTranslations('admin');
  const update = useContentStore((s) => s.updateServiceCenter);
  const remove = useContentStore((s) => s.removeServiceCenter);
  const reorder = useContentStore((s) => s.reorderServiceCenter);
  const addItem = useContentStore((s) => s.addServiceItem);
  const updItem = useContentStore((s) => s.updateServiceItem);
  const rmItem = useContentStore((s) => s.removeServiceItem);
  const set = (patch: Partial<ServiceCenter>) => update(center.id, patch);

  return (
    <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm font-extrabold">{center.name || t('fldName')}</span>
        <RowActions index={index} total={total} onUp={() => reorder(center.id, -1)} onDown={() => reorder(center.id, 1)} onRemove={() => { if (confirm(t('locDeleteConfirm'))) remove(center.id); }} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <F label={t('fldName')}><Input value={center.name} onChange={(e) => set({ name: e.target.value })} /></F>
        <F label={t('fldShortName')}><Input value={center.shortName ?? ''} onChange={(e) => set({ shortName: e.target.value })} /></F>
        <F label={t('fldAddress')}><Input value={center.address} onChange={(e) => set({ address: e.target.value })} /></F>
        <F label={t('fldHours')}><Input value={center.workingHours} onChange={(e) => set({ workingHours: e.target.value })} /></F>
        <F label={t('fldPhone')}><Input value={center.phone} onChange={(e) => set({ phone: e.target.value })} /></F>
        <F label={t('fldSecondaryPhone')}><Input value={center.secondaryPhone ?? ''} onChange={(e) => set({ secondaryPhone: e.target.value })} /></F>
        <F label={t('fldEmail')}><Input value={center.email ?? ''} onChange={(e) => set({ email: e.target.value })} /></F>
        <F label={t('fldImage')}><Input value={center.image ?? ''} onChange={(e) => set({ image: e.target.value })} /></F>
        <F label={t('fldAbout')} full>
          <textarea value={center.about ?? ''} onChange={(e) => set({ about: e.target.value })} rows={2} className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60" />
        </F>
        <F label={t('fldVideo')} full><Input value={center.videoUrl ?? ''} onChange={(e) => set({ videoUrl: e.target.value })} /></F>
      </div>

      {/* services list */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/45">{t('servicesListLabel')}</h4>
          <button type="button" onClick={() => addItem(center.id, { id: `it_${Date.now()}`, title: '' })} className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow">
            <Plus className="h-3 w-3" /> {t('addServiceItemBtn')}
          </button>
        </div>
        <div className="space-y-2">
          {center.services.map((it: ServiceItem) => (
            <div key={it.id} className="rounded-xl border border-brand-surface-border bg-brand-dark/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Input value={it.title} placeholder={t('svcItemTitle')} onChange={(e) => updItem(center.id, it.id, { title: e.target.value })} />
                <button type="button" onClick={() => rmItem(center.id, it.id)} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input value={it.description ?? ''} placeholder={t('svcItemDesc')} onChange={(e) => updItem(center.id, it.id, { description: e.target.value })} />
                <Input value={it.priceFrom != null ? String(it.priceFrom) : ''} placeholder={t('svcItemPrice')} onChange={(e) => updItem(center.id, it.id, { priceFrom: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })} />
                <Input value={it.duration ?? ''} placeholder={t('svcItemDuration')} onChange={(e) => updItem(center.id, it.id, { duration: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ============================ Franchise ============================ */

function FranchiseTab() {
  const t = useTranslations('admin');
  const { notify } = useHaptic();
  const mounted = useMounted();
  const fr = useContentStore((s) => s.franchise);
  const setFr = useContentStore((s) => s.setFranchise);
  const resetFr = useContentStore((s) => s.resetFranchise);
  const v = mounted ? fr : {};

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { resetFr(); notify('warning'); }}>
          {t('resetButton')}
        </Button>
      </div>
      <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <F label={t('frTitleLabel')} full><Input value={v.title ?? ''} onChange={(e) => setFr({ title: e.target.value })} /></F>
          <F label={t('frDescLabel')} full>
            <textarea value={v.description ?? ''} onChange={(e) => setFr({ description: e.target.value })} rows={2} className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60" />
          </F>
          <F label={t('frStatInvestment')}><Input value={v.statInvestment ?? ''} onChange={(e) => setFr({ statInvestment: e.target.value })} /></F>
          <F label={t('frStatPayback')}><Input value={v.statPayback ?? ''} onChange={(e) => setFr({ statPayback: e.target.value })} /></F>
          <F label={t('frStatBranches')}><Input value={v.statBranches ?? ''} onChange={(e) => setFr({ statBranches: e.target.value })} /></F>
        </div>
        <p className="mt-3 text-[11px] text-white/45">{t('frOverrideHint')}</p>
      </article>
    </section>
  );
}

/* ============================ shared ============================ */

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn('block', full && 'sm:col-span-2')}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">{label}</span>
      {children}
    </label>
  );
}

function RowActions({ index, total, onUp, onDown, onRemove }: { index: number; total: number; onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <IconBtn disabled={index === 0} onClick={onUp}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
      <IconBtn disabled={index === total - 1} onClick={onDown}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
      <IconBtn danger onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
    </div>
  );
}

function IconBtn({ children, disabled, danger, onClick }: { children: React.ReactNode; disabled?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition-all disabled:cursor-not-allowed disabled:opacity-30 hover:bg-white/8 hover:text-white',
        danger && 'hover:!bg-danger/15 hover:!text-danger',
      )}
    >
      {children}
    </button>
  );
}
