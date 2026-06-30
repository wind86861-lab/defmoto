'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  RotateCcw,
  Search,
  Check,
  Upload,
  Package,
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
import type { Product } from '@/types/product';

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 50) || `product-${Date.now().toString(36)}`
  );
}

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const { notify } = useHaptic();
  const products = useContentStore((s) => s.products);
  const addProduct = useContentStore((s) => s.addProduct);
  const resetProducts = useContentStore((s) => s.resetProducts);
  const [q, setQ] = useState('');

  const list = mounted ? products : [];
  const filtered = q.trim()
    ? list.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.brand?.toLowerCase().includes(q.toLowerCase()),
      )
    : list;

  const handleAdd = () => {
    notify('success');
    addProduct({
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slug: `product-${Date.now().toString(36)}`,
      name: '',
      category: '',
      categorySlug: '',
      images: [],
      price: 0,
      currency: 'UZS',
      inStock: true,
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navProducts')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('prodSectionTitle', { count: list.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (confirm(t('resetConfirmText'))) {
                resetProducts();
                notify('warning');
              }
            }}
          >
            {t('resetButton')}
          </Button>
          <Button size="md" glow leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
            {t('prodAddBtn')}
          </Button>
        </div>
      </header>

      <Input
        leftIcon={<Search className="h-4 w-4" />}
        placeholder={t('prodSearchPh')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-surface-border py-12 text-center">
          <Package className="mb-3 h-9 w-9 text-white/30" />
          <p className="text-sm font-semibold text-white/65">{t('prodNoneTitle')}</p>
          <p className="mt-1 text-xs text-white/45">{t('prodNoneDesc')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <ProductCardRow key={p.id} product={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductCardRow({ product }: { product: Product }) {
  const t = useTranslations('admin');
  const tCategories = useTranslations('categories');
  const { notify } = useHaptic();
  const toast = useToast();
  const update = useContentStore((s) => s.updateProduct);
  const remove = useContentStore((s) => s.removeProduct);
  const categories = useContentStore((s) => s.categories);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Product>(product);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(!product.name);
  useEffect(() => {
    setDraft(product);
    setDirty(false);
  }, [product]);
  const set = (patch: Partial<Product>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const save = () => {
    const next = { ...draft };
    if (!next.slug || next.slug.startsWith('product-')) next.slug = slugify(next.name);
    update(product.id, next);
    setDirty(false);
    notify('success');
    toast.success(t('itemSavedToast'));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImage(file);
      set({ images: [url, ...draft.images.slice(1)] });
    } catch {
      /* upload failed — ignore */
    }
  };

  const onPickCategory = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    set({ categorySlug: slug, category: c ? c.name : '' });
  };

  return (
    <li className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-dark">
          <ProductImage
            src={draft.images[0]}
            alt={draft.name}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold">{draft.name || t('fldProdName')}</p>
          <p className="text-[11px] text-white/45">
            {draft.price ? `${draft.price.toLocaleString('ru-RU')} so'm` : '—'}
            {draft.brand ? ` · ${draft.brand}` : ''}
          </p>
        </button>
        {dirty && (
          <span className="hidden text-[11px] font-semibold text-brand-yellow sm:inline">
            {t('unsavedHint')}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all',
            dirty
              ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110'
              : 'cursor-not-allowed bg-brand-surface-elevated text-white/35',
          )}
        >
          <Check className="h-4 w-4" /> {t('itemSaveBtn')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('locDeleteConfirm'))) remove(product.id);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-danger/15 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-2.5 border-t border-brand-surface-border pt-4 sm:grid-cols-2">
          <PF label={t('fldProdName')} full>
            <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </PF>
          <PF label={t('fldProdBrand')}>
            <Input value={draft.brand ?? ''} onChange={(e) => set({ brand: e.target.value })} />
          </PF>
          <PF label={t('fldProdCategory')}>
            <select
              value={draft.categorySlug}
              onChange={(e) => onPickCategory(e.target.value)}
              className="h-12 w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 text-base font-semibold text-white outline-none focus:border-brand-yellow/60"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {categoryName(tCategories, c)}
                </option>
              ))}
            </select>
          </PF>
          <PF label={t('fldProdPrice')}>
            <Input value={String(draft.price)} onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </PF>
          <PF label={t('fldProdOldPrice')}>
            <Input value={draft.oldPrice != null ? String(draft.oldPrice) : ''} onChange={(e) => set({ oldPrice: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })} />
          </PF>
          <PF label={t('fldProdRating')}>
            <Input value={draft.rating != null ? String(draft.rating) : ''} onChange={(e) => set({ rating: e.target.value ? Number(e.target.value) : undefined })} />
          </PF>
          <PF label={t('fldProdReviews')}>
            <Input value={draft.reviewCount != null ? String(draft.reviewCount) : ''} onChange={(e) => set({ reviewCount: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })} />
          </PF>
          <PF label={t('fldProdBadges')} full>
            <Input value={(draft.badges ?? []).join(', ')} onChange={(e) => set({ badges: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
          </PF>
          <PF label={t('fldProdDesc')} full>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60"
            />
          </PF>

          <PF label={t('fldProdImage')} full>
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
                <ProductImage src={draft.images[0]} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
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
          </PF>
          <PF label={t('fldProdImageMore')} full>
            <Input
              value={draft.images.slice(1).join(', ')}
              onChange={(e) =>
                set({
                  images: [draft.images[0] ?? '', ...e.target.value.split(',').map((x) => x.trim()).filter(Boolean)].filter(Boolean),
                })
              }
            />
          </PF>

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <Toggle checked={draft.inStock} onChange={(v) => set({ inStock: v })} label={t('fldProdInStock')} />
            <Toggle checked={Boolean(draft.isNew)} onChange={(v) => set({ isNew: v })} label={t('fldProdNew')} />
            <Toggle checked={Boolean(draft.isBestseller)} onChange={(v) => set({ isBestseller: v })} label={t('fldProdBestseller')} />
          </div>
        </div>
      )}
    </li>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 cursor-pointer accent-brand-yellow" />
      {label}
    </label>
  );
}

function PF({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn('block', full && 'sm:col-span-2')}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</span>
      {children}
    </label>
  );
}
