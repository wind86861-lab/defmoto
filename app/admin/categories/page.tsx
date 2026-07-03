'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Upload,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { useContentStore } from '@/lib/stores/content';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { categoryName } from '@/lib/categoryName';
import { uploadImage } from '@/lib/uploadImage';
import type { Category } from '@/types/product';

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || `cat-${Date.now().toString(36)}`
  );
}

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const { notify } = useHaptic();
  const categories = useContentStore((s) => s.categories);
  const addCategory = useContentStore((s) => s.addCategory);

  const list = mounted ? categories : [];

  const handleAdd = () => {
    notify('success');
    addCategory({
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slug: `cat-${Date.now().toString(36)}`,
      name: '',
      icon: '🏷️',
      productCount: 0,
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navCategories')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('catSectionTitle', { count: list.length })}
          </p>
        </div>
        <Button size="md" glow leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          {t('catAddBtn')}
        </Button>
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-surface-border py-12 text-center">
          <Tag className="mb-3 h-9 w-9 text-white/30" />
          <p className="text-sm font-semibold text-white/65">{t('catNoneTitle')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((c, i) => (
            <CategoryRow key={c.id} category={c} index={i} total={list.length} />
          ))}
        </ul>
      )}

      <p className="rounded-xl border border-brand-yellow/20 bg-brand-yellow/8 p-3 text-[11px] text-white/65">
        {t('catSlugHint')}
      </p>
    </div>
  );
}

function CategoryRow({ category, index, total }: { category: Category; index: number; total: number }) {
  const t = useTranslations('admin');
  const tCategories = useTranslations('categories');
  const { notify } = useHaptic();
  const toast = useToast();
  const update = useContentStore((s) => s.updateCategory);
  const remove = useContentStore((s) => s.removeCategory);
  const reorder = useContentStore((s) => s.reorderCategory);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Category>(category);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setDraft(category);
    setDirty(false);
  }, [category]);
  const set = (patch: Partial<Category>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const save = () => {
    const next = { ...draft };
    if (!next.slug || next.slug.startsWith('cat-')) next.slug = slugify(next.name);
    update(category.id, next);
    setDirty(false);
    notify('success');
    toast.success(t('itemSavedToast'));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      set({ image: await uploadImage(file) });
    } catch {
      /* upload failed — ignore */
    }
  };

  return (
    <li className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-dark text-xl">
          {draft.image ? (
            <ProductImage src={draft.image} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
          ) : (
            <Tag className="h-5 w-5 text-white/40" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-sm font-extrabold">
          {categoryName(tCategories, draft) || t('fldCatName')}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconAction onClick={() => reorder(category.id, -1)} disabled={index === 0} aria-label={t('moveUpAria')}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction onClick={() => reorder(category.id, 1)} disabled={index === total - 1} aria-label={t('moveDownAria')}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction onClick={() => { if (confirm(t('locDeleteConfirm'))) remove(category.id); }} danger aria-label={t('deleteAria')}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <CF label={t('fldCatName')}>
          <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </CF>
        <CF label={t('fldCatSlug')}>
          <Input value={draft.slug} onChange={(e) => set({ slug: e.target.value })} />
        </CF>
        <CF label={t('fldCatCount')}>
          <Input
            value={draft.productCount != null ? String(draft.productCount) : ''}
            onChange={(e) => set({ productCount: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })}
          />
        </CF>
        <CF label={t('fldCatImage')} full>
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
              <ProductImage src={draft.image ?? ''} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-sm font-semibold text-white/80 hover:border-brand-yellow/40 hover:text-brand-yellow"
            >
              <Upload className="h-4 w-4" /> {t('uploadImageBtn')}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImage} />
          </div>
        </CF>
      </div>

      <div className="mt-3 flex justify-end">
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
          <Check className="h-4 w-4" /> {t('itemSaveBtn')}
        </button>
      </div>
    </li>
  );
}

function CF({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn('block', full && 'sm:col-span-2')}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</span>
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition-all disabled:cursor-not-allowed disabled:opacity-30 hover:bg-white/8 hover:text-white',
        danger && 'hover:!bg-danger/15 hover:!text-danger',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
