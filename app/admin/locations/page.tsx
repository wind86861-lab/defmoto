'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  Wrench,
  Sparkles,
  Check,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { TrInput } from '@/components/admin/TrInput';
import { ProductImage } from '@/components/ui/ProductImage';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { useContentStore } from '@/lib/stores/content';
import { uploadImage } from '@/lib/uploadImage';
import type { Branch, ServiceCenter, ServiceItem } from '@/types/content';

/** Image upload field — replaces raw-URL inputs. */
function ImageUpload({ value, onChange, label }: { value?: string; onChange: (url: string) => void; label: string }) {
  const t = useTranslations('admin');
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f)); } catch { /* ignore */ } finally { setBusy(false); }
  };
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">{label}</span>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
          <ProductImage src={value ?? ''} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
        </span>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-sm font-semibold text-white/80 hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {busy ? '…' : t('uploadImageBtn')}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-white/45 hover:text-danger">✕</button>
        )}
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
      </div>
    </label>
  );
}

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
  const list = mounted ? branches : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
          {t('locBranchesCount', { count: list.length })}
        </h2>
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
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('addBranchBtn')}
        </button>
      </div>

      {list.map((b, i) => (
        <BranchCard key={b.id} branch={b} index={i} total={list.length} />
      ))}
    </section>
  );
}

function BranchCard({ branch, index, total }: { branch: Branch; index: number; total: number }) {
  const t = useTranslations('admin');
  const { notify } = useHaptic();
  const toast = useToast();
  const update = useContentStore((s) => s.updateBranch);
  const remove = useContentStore((s) => s.removeBranch);
  const reorder = useContentStore((s) => s.reorderBranch);

  const [draft, setDraft] = useState<Branch>(branch);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDraft(branch); setDirty(false); }, [branch]);
  const set = (patch: Partial<Branch>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const save = () => { update(branch.id, draft); setDirty(false); notify('success'); toast.success(t('itemSavedToast')); };

  return (
    <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm font-extrabold">
          №{draft.number} · {draft.name || t('fldName')}
        </span>
        <RowActions index={index} total={total} onUp={() => reorder(branch.id, -1)} onDown={() => reorder(branch.id, 1)} onRemove={() => { if (confirm(t('locDeleteConfirm'))) remove(branch.id); }} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <F label={t('fldName')}><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} /></F>
        <F label={`${t('fldName')} — RU / EN`} full><TrInput tr={draft.tr} field="name" base={draft.name} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldNumber')}><Input type="number" value={String(draft.number)} onChange={(e) => set({ number: Number(e.target.value) || 0 })} /></F>
        <F label={t('fldLegalName')}><Input value={draft.legalName ?? ''} onChange={(e) => set({ legalName: e.target.value })} /></F>
        <F label={t('fldDirector')}><Input value={draft.director ?? ''} onChange={(e) => set({ director: e.target.value })} /></F>
        <F label={t('fldRegion')}><Input value={draft.region ?? ''} placeholder="Toshkent viloyati" onChange={(e) => set({ region: e.target.value })} /></F>
        <F label={t('fldCity')}><Input value={draft.city} onChange={(e) => set({ city: e.target.value })} /></F>
        <F label={t('fldAddress')}><Input value={draft.address} onChange={(e) => set({ address: e.target.value })} /></F>
        <F label={t('fldPhone')}><Input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} /></F>
        <F label={t('fldSecondaryPhone')}><Input value={draft.secondaryPhone ?? ''} onChange={(e) => set({ secondaryPhone: e.target.value })} /></F>
        <F label={t('fldTelegram')}><Input value={draft.telegram ?? ''} placeholder="@username" onChange={(e) => set({ telegram: e.target.value })} /></F>
        <F label={t('fldHours')}><Input value={draft.workingHours} onChange={(e) => set({ workingHours: e.target.value })} /></F>
        <F label={`${t('fldHours')} — RU / EN`} full><TrInput tr={draft.tr} field="workingHours" base={draft.workingHours} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldMapUrl')} full><Input value={draft.mapUrl ?? ''} placeholder="https://maps.google.com/..." onChange={(e) => set({ mapUrl: e.target.value })} /></F>
        <ImageUpload value={draft.image} onChange={(url) => set({ image: url })} label={t('fldImage')} />
        <F label={t('fldVideo')} full><Input value={draft.videoUrl ?? ''} placeholder="https://youtube.com/..." onChange={(e) => set({ videoUrl: e.target.value })} /></F>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={Boolean(draft.isHeadOffice)} onChange={(e) => set({ isHeadOffice: e.target.checked })} className="h-4 w-4 cursor-pointer accent-brand-yellow" />
          {t('fldHeadOffice')}
        </label>
        <SaveBtn dirty={dirty} onClick={save} label={t('itemSaveBtn')} hint={t('unsavedHint')} />
      </div>
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
  const list = mounted ? centers : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
          {t('locServiceCount', { count: list.length })}
        </h2>
        <button
          type="button"
          onClick={() => { impact('light'); add({ id: `s_${Date.now()}`, name: '', address: '', phone: '', workingHours: '', services: [] }); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('addServiceBtn')}
        </button>
      </div>

      {list.map((c, i) => (
        <ServiceCard key={c.id} center={c} index={i} total={list.length} />
      ))}
    </section>
  );
}

function ServiceCard({ center, index, total }: { center: ServiceCenter; index: number; total: number }) {
  const t = useTranslations('admin');
  const { notify } = useHaptic();
  const toast = useToast();
  const update = useContentStore((s) => s.updateServiceCenter);
  const remove = useContentStore((s) => s.removeServiceCenter);
  const reorder = useContentStore((s) => s.reorderServiceCenter);

  const [draft, setDraft] = useState<ServiceCenter>(center);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDraft(center); setDirty(false); }, [center]);
  const set = (patch: Partial<ServiceCenter>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const setItem = (itemId: string, patch: Partial<ServiceItem>) =>
    set({ services: draft.services.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) });
  const addItem = () => set({ services: [...draft.services, { id: `it_${Date.now()}`, title: '' }] });
  const rmItem = (itemId: string) => set({ services: draft.services.filter((it) => it.id !== itemId) });
  const save = () => { update(center.id, draft); setDirty(false); notify('success'); toast.success(t('itemSavedToast')); };

  return (
    <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm font-extrabold">{draft.name || t('fldName')}</span>
        <RowActions index={index} total={total} onUp={() => reorder(center.id, -1)} onDown={() => reorder(center.id, 1)} onRemove={() => { if (confirm(t('locDeleteConfirm'))) remove(center.id); }} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <F label={t('fldName')}><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} /></F>
        <F label={`${t('fldName')} — RU / EN`} full><TrInput tr={draft.tr} field="name" base={draft.name} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldRegion')}><Input value={draft.region ?? ''} placeholder="Toshkent viloyati" onChange={(e) => set({ region: e.target.value })} /></F>
        <F label={t('fldShortName')}><Input value={draft.shortName ?? ''} onChange={(e) => set({ shortName: e.target.value })} /></F>
        <F label={`${t('fldShortName')} — RU / EN`} full><TrInput tr={draft.tr} field="shortName" base={draft.shortName ?? ''} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldAddress')}><Input value={draft.address} onChange={(e) => set({ address: e.target.value })} /></F>
        <F label={t('fldHours')}><Input value={draft.workingHours} onChange={(e) => set({ workingHours: e.target.value })} /></F>
        <F label={`${t('fldHours')} — RU / EN`} full><TrInput tr={draft.tr} field="workingHours" base={draft.workingHours} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldPhone')}><Input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} /></F>
        <F label={t('fldSecondaryPhone')}><Input value={draft.secondaryPhone ?? ''} onChange={(e) => set({ secondaryPhone: e.target.value })} /></F>
        <F label={t('fldTelegram')}><Input value={draft.telegram ?? ''} placeholder="@username" onChange={(e) => set({ telegram: e.target.value })} /></F>
        <F label={t('fldAbout')} full>
          <textarea value={draft.about ?? ''} onChange={(e) => set({ about: e.target.value })} rows={2} className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60" />
        </F>
        <F label={`${t('fldAbout')} — RU / EN`} full><TrInput tr={draft.tr} field="about" base={draft.about ?? ''} onChange={(tr) => set({ tr })} textarea /></F>
        <ImageUpload value={draft.image} onChange={(url) => set({ image: url })} label={t('fldImage')} />
        <F label={t('fldVideo')} full><Input value={draft.videoUrl ?? ''} placeholder="https://youtube.com/..." onChange={(e) => set({ videoUrl: e.target.value })} /></F>
      </div>

      {/* services list */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/45">{t('servicesListLabel')}</h4>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow">
            <Plus className="h-3 w-3" /> {t('addServiceItemBtn')}
          </button>
        </div>
        <div className="space-y-2">
          {draft.services.map((it: ServiceItem) => (
            <div key={it.id} className="rounded-xl border border-brand-surface-border bg-brand-dark/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Input value={it.title} placeholder={t('svcItemTitle')} onChange={(e) => setItem(it.id, { title: e.target.value })} />
                <TrInput tr={it.tr} field="title" base={it.title} onChange={(tr) => setItem(it.id, { tr })} />
                <button type="button" onClick={() => rmItem(it.id)} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input value={it.description ?? ''} placeholder={t('svcItemDesc')} onChange={(e) => setItem(it.id, { description: e.target.value })} />
                <TrInput tr={it.tr} field="description" base={it.description ?? ''} onChange={(tr) => setItem(it.id, { tr })} />
                <Input value={it.priceFrom != null ? String(it.priceFrom) : ''} placeholder={t('svcItemPrice')} onChange={(e) => setItem(it.id, { priceFrom: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })} />
                <Input value={it.duration ?? ''} placeholder={t('svcItemDuration')} onChange={(e) => setItem(it.id, { duration: e.target.value })} />
                <TrInput tr={it.tr} field="duration" base={it.duration ?? ''} onChange={(tr) => setItem(it.id, { tr })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <SaveBtn dirty={dirty} onClick={save} label={t('itemSaveBtn')} hint={t('unsavedHint')} />
      </div>
    </article>
  );
}

/* ============================ Franchise ============================ */

function FranchiseTab() {
  const t = useTranslations('admin');
  const { notify, impact } = useHaptic();
  const toast = useToast();
  const mounted = useMounted();
  const fr = useContentStore((s) => s.franchise);
  const setFr = useContentStore((s) => s.setFranchise);
  const franchises = useContentStore((s) => s.franchises);
  const addF = useContentStore((s) => s.addFranchise);
  const list = mounted ? franchises : [];

  const [draft, setDraft] = useState(fr);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (mounted) { setDraft(fr); setDirty(false); } }, [mounted, fr]);
  const set = (patch: Partial<typeof fr>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const save = () => { setFr(draft); setDirty(false); notify('success'); toast.success(t('itemSavedToast')); };
  const v = mounted ? draft : {};

  return (
    <section className="space-y-4">
      {/* Section heading text */}
      <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <F label={t('frTitleLabel')} full><Input value={v.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></F>
          <F label={t('frDescLabel')} full>
            <textarea value={v.description ?? ''} onChange={(e) => set({ description: e.target.value })} rows={2} className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60" />
          </F>
        </div>
        <div className="mt-3 flex justify-end">
          <SaveBtn dirty={dirty} onClick={save} label={t('itemSaveBtn')} hint={t('unsavedHint')} />
        </div>
      </article>

      {/* Franchise locations list */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">{t('frLocationsCount', { count: list.length })}</h2>
        <button
          type="button"
          onClick={() => { impact('light'); addF({ id: `fr_${Date.now()}`, name: '' }); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> {t('frAddLocation')}
        </button>
      </div>
      {list.map((f, i) => (
        <FranchiseLocCard key={f.id} f={f} index={i} total={list.length} />
      ))}
    </section>
  );
}

function FranchiseLocCard({ f, index, total }: { f: import('@/types/content').FranchiseLocation; index: number; total: number }) {
  const t = useTranslations('admin');
  const { notify } = useHaptic();
  const toast = useToast();
  const update = useContentStore((s) => s.updateFranchise);
  const remove = useContentStore((s) => s.removeFranchise);
  const reorder = useContentStore((s) => s.reorderFranchise);
  const [draft, setDraft] = useState(f);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDraft(f); setDirty(false); }, [f]);
  const set = (patch: Partial<typeof f>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const save = () => { update(f.id, draft); setDirty(false); notify('success'); toast.success(t('itemSavedToast')); };

  return (
    <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm font-extrabold">{draft.name || t('fldName')}</span>
        <RowActions index={index} total={total} onUp={() => reorder(f.id, -1)} onDown={() => reorder(f.id, 1)} onRemove={() => { if (confirm(t('locDeleteConfirm'))) remove(f.id); }} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <F label={t('fldName')}><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} /></F>
        <F label={`${t('fldName')} — RU / EN`} full><TrInput tr={draft.tr} field="name" base={draft.name} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldRegion')}><Input value={draft.region ?? ''} placeholder="Toshkent viloyati" onChange={(e) => set({ region: e.target.value })} /></F>
        <F label={t('fldCity')}><Input value={draft.city ?? ''} onChange={(e) => set({ city: e.target.value })} /></F>
        <F label={t('fldAddress')}><Input value={draft.address ?? ''} onChange={(e) => set({ address: e.target.value })} /></F>
        <F label={t('fldPhone')}><Input value={draft.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} /></F>
        <F label={t('fldTelegram')}><Input value={draft.telegram ?? ''} placeholder="@username" onChange={(e) => set({ telegram: e.target.value })} /></F>
        <F label={t('fldHours')}><Input value={draft.workingHours ?? ''} onChange={(e) => set({ workingHours: e.target.value })} /></F>
        <F label={`${t('fldHours')} — RU / EN`} full><TrInput tr={draft.tr} field="workingHours" base={draft.workingHours ?? ''} onChange={(tr) => set({ tr })} /></F>
        <F label={t('fldMapUrl')}><Input value={draft.mapUrl ?? ''} placeholder="https://maps.google.com/..." onChange={(e) => set({ mapUrl: e.target.value })} /></F>
        <ImageUpload value={draft.image} onChange={(url) => set({ image: url })} label={t('fldImage')} />
      </div>
      <div className="mt-3 flex justify-end">
        <SaveBtn dirty={dirty} onClick={save} label={t('itemSaveBtn')} hint={t('unsavedHint')} />
      </div>
    </article>
  );
}

/* ============================ shared ============================ */

function SaveBtn({ dirty, onClick, label, hint }: { dirty: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      {dirty && (
        <span className="hidden text-[11px] font-semibold text-brand-yellow sm:inline">
          {hint}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={!dirty}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all',
          dirty
            ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110'
            : 'cursor-not-allowed bg-brand-surface-elevated text-white/35',
        )}
      >
        <Check className="h-4 w-4" />
        {label}
      </button>
    </div>
  );
}

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
