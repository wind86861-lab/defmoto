'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Store,
  Link2,
  Check,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useSiteSettings,
  type Marketplace,
} from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { uploadImage } from '@/lib/uploadImage';

export default function AdminMarketplacesPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const { notify, impact } = useHaptic();
  const marketplaces = useSiteSettings((s) => s.marketplaces);
  const addMarketplace = useSiteSettings((s) => s.addMarketplace);
  const updateMarketplace = useSiteSettings((s) => s.updateMarketplace);
  const removeMarketplace = useSiteSettings((s) => s.removeMarketplace);
  const reorderMarketplace = useSiteSettings((s) => s.reorderMarketplace);
  const resetMarketplaces = useSiteSettings((s) => s.resetMarketplaces);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const list = mounted ? marketplaces : [];

  const flash = () => {
    setSavedAt(new Date().toLocaleTimeString('en-GB'));
    setTimeout(() => setSavedAt(null), 2500);
  };

  const handleAdd = () => {
    impact('light');
    addMarketplace({
      id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      label: '',
      url: '',
      color: '#FFB800',
      enabled: true,
    });
    flash();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navMarketplaces')}
          </h1>
          <p className="mt-1 text-sm text-white/55">{t('marketplacesSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (confirm(t('resetConfirmText'))) {
                resetMarketplaces();
                notify('warning');
              }
            }}
          >
            {t('resetButton')}
          </Button>
        </div>
      </header>

      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success animate-fade-in">
          <Check className="h-4 w-4" strokeWidth={3} />
          {t('savedFlashText', { time: savedAt })}
        </div>
      )}

      <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
            {t('marketplacesSectionTitle', { count: list.length })}
          </h2>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addMarketplaceButton')}
          </button>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-surface-border py-10 text-center">
            <Store className="mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm font-semibold text-white/65">
              {t('noMarketplacesTitle')}
            </p>
            <p className="mt-1 text-xs text-white/45">{t('noMarketplacesDesc')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((m, i) => (
              <MarketplaceRow
                key={m.id}
                item={m}
                index={i}
                total={list.length}
                onChange={(patch) => {
                  updateMarketplace(m.id, patch);
                  flash();
                }}
                onRemove={() => {
                  removeMarketplace(m.id);
                  flash();
                }}
                onMove={(dir) => {
                  reorderMarketplace(m.id, dir);
                  flash();
                }}
              />
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-xl border border-brand-yellow/20 bg-brand-yellow/8 p-3 text-[11px] text-white/65">
          {t.rich('marketplacesTipText', {
            b: (chunks) => <strong className="text-brand-yellow">{chunks}</strong>,
          })}
        </div>
      </section>
    </div>
  );
}

function MarketplaceRow({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  item: Marketplace;
  index: number;
  total: number;
  onChange: (patch: Partial<Marketplace>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const t = useTranslations('admin');
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Marketplace>(item);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDraft(item); setDirty(false); }, [item]);
  const set = (patch: Partial<Marketplace>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const save = () => { onChange(draft); setDirty(false); };

  const handleIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      set({ icon: await uploadImage(file) });
    } catch {
      /* upload failed — ignore */
    }
  };

  return (
    <li className="rounded-xl border border-brand-surface-border bg-brand-dark/40 p-3.5">
      <div className="flex items-center gap-3">
        {/* Live preview — uploaded logo or colour badge */}
        {draft.icon ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.icon} alt="" className="h-full w-full object-contain p-0.5" />
          </span>
        ) : (
          <span
            className="inline-flex h-8 min-w-[3rem] items-center justify-center rounded-md px-2.5 text-xs font-bold text-white shadow-sm"
            style={{ background: draft.color || '#333' }}
          >
            {draft.label || '—'}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {draft.name || t('mpNamePlaceholder')}
          </p>
          <p className="truncate text-[10px] text-white/45">{draft.url || '—'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconAction
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t('moveUpAria')}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={t('moveDownAria')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction onClick={onRemove} danger aria-label={t('deleteAria')}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Field label={t('mpNameLabel')}>
          <Input
            placeholder={t('mpNamePlaceholder')}
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label={t('mpLabelLabel')}>
          <Input
            placeholder={t('mpLabelPlaceholder')}
            value={draft.label}
            onChange={(e) => set({ label: e.target.value })}
          />
        </Field>
        <Field label={t('mpUrlLabel')}>
          <Input
            leftIcon={<Link2 className="h-3.5 w-3.5" />}
            placeholder={t('mpUrlPlaceholder')}
            value={draft.url}
            onChange={(e) => set({ url: e.target.value })}
          />
        </Field>
        <div className="flex items-end gap-3">
          <Field label={t('mpColorLabel')} className="flex-1">
            <div className="flex h-12 items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface px-3">
              <input
                type="color"
                value={draft.color}
                onChange={(e) => set({ color: e.target.value })}
                className="h-7 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label={t('mpColorLabel')}
              />
              <span className="text-sm font-semibold uppercase text-white/70">
                {draft.color}
              </span>
            </div>
          </Field>
          <label className="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface px-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-brand-yellow"
            />
            {t('mpEnabledLabel')}
          </label>
        </div>

        {/* Icon / logo upload */}
        <Field label={t('mpIconLabel')} className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-surface-border bg-white">
              {draft.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.icon} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <Store className="h-5 w-5 text-brand-dark/40" />
              )}
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow"
            >
              <Upload className="h-4 w-4" />
              {t('mpIconUploadBtn')}
            </button>
            {draft.icon && (
              <button
                type="button"
                onClick={() => set({ icon: undefined })}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition-colors hover:text-danger"
              >
                <X className="h-4 w-4" />
                {t('mpIconRemoveBtn')}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              hidden
              onChange={handleIcon}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-white/40">{t('mpIconHint')}</p>
        </Field>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {dirty && (
          <span className="text-[11px] font-semibold text-brand-yellow">{t('unsavedHint')}</span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all',
            dirty
              ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110'
              : 'cursor-not-allowed bg-brand-surface-elevated text-white/35',
          )}
        >
          <Check className="h-4 w-4" />
          {t('itemSaveBtn')}
        </button>
      </div>
    </li>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function IconAction({
  children,
  disabled,
  danger,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition-all',
        'disabled:cursor-not-allowed disabled:opacity-30',
        'hover:bg-white/8 hover:text-white',
        danger && 'hover:!bg-danger/15 hover:!text-danger',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
