'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  Search,
  Check,
  Upload,
  Package,
  X,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { useContentStore } from '@/lib/stores/content';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { categoryName } from '@/lib/categoryName';
import { uploadImage, uploadVideo } from '@/lib/uploadImage';
import type { Product, CompetitorPrice, ProductVariant } from '@/types/product';

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

function emptyProduct(): Product {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slug: `product-${Date.now().toString(36)}`,
    name: '',
    category: '',
    categorySlug: '',
    images: [],
    price: 0,
    currency: 'UZS',
    inStock: true,
  };
}

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const products = useContentStore((s) => s.products);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const list = mounted ? products : [];
  const filtered = q.trim()
    ? list.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.brand?.toLowerCase().includes(q.toLowerCase()),
      )
    : list;

  const openNew = () => {
    setEditing(emptyProduct());
    setIsNew(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setIsNew(false);
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
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-4 py-2.5 text-sm font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> {t('prodAddBtn')}
        </button>
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
        <ul className="space-y-2.5">
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} onEdit={() => openEdit(p)} />
          ))}
        </ul>
      )}

      {editing && (
        <ProductModal
          product={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductRow({ product, onEdit }: { product: Product; onEdit: () => void }) {
  const t = useTranslations('admin');
  const remove = useContentStore((s) => s.removeProduct);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-dark">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
        />
      </div>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold">{product.name || t('fldProdName')}</p>
        <p className="text-[11px] text-white/45">
          {product.price ? `${product.price.toLocaleString('ru-RU')} so'm` : '—'}
          {product.brand ? ` · ${product.brand}` : ''}
        </p>
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="rounded-xl border border-brand-surface-border px-3 py-2 text-xs font-bold text-white/80 hover:border-brand-yellow/40 hover:text-brand-yellow"
      >
        {t('itemEditBtn')}
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
    </li>
  );
}

function ProductModal({
  product,
  isNew,
  onClose,
}: {
  product: Product;
  isNew: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('admin');
  const tCategories = useTranslations('categories');
  const { notify } = useHaptic();
  const toast = useToast();
  const addProduct = useContentStore((s) => s.addProduct);
  const updateProduct = useContentStore((s) => s.updateProduct);
  const categories = useContentStore((s) => s.categories);
  const marketplaces = useSiteSettings((s) => s.marketplaces);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [draft, setDraft] = useState<Product>(product);
  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }));

  const onPickCategory = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    set({ categorySlug: slug, category: c ? c.name : '' });
  };

  const addImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadImage(f));
      set({ images: [...draft.images, ...urls] });
    } catch {
      toast.info(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };
  const removeImage = (idx: number) =>
    set({ images: draft.images.filter((_, i) => i !== idx) });

  const addVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setVideoUploading(true);
    try {
      set({ video: await uploadVideo(file) });
    } catch {
      toast.info(t('uploadFailed'));
    } finally {
      setVideoUploading(false);
    }
  };

  /* marketplace prices */
  const comp = draft.competitorPrices ?? [];
  const setComp = (next: CompetitorPrice[]) => set({ competitorPrices: next });
  const addComp = () => {
    const used = new Set(comp.map((c) => c.source));
    const mp = marketplaces.find((m) => !used.has(m.id)) ?? marketplaces[0];
    setComp([
      ...comp,
      mp
        ? { source: mp.id, label: mp.label, color: mp.color, price: 0, url: mp.url }
        : { source: '', label: '', price: 0 },
    ]);
  };
  const updateComp = (idx: number, patch: Partial<CompetitorPrice>) =>
    setComp(comp.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const pickMarketplace = (idx: number, id: string) => {
    const mp = marketplaces.find((m) => m.id === id);
    updateComp(idx, mp ? { source: mp.id, label: mp.label, color: mp.color, url: mp.url } : { source: id });
  };
  const removeComp = (idx: number) => setComp(comp.filter((_, i) => i !== idx));

  // Variants (colour / size / stock).
  const vars = draft.variants ?? [];
  const setVars = (next: ProductVariant[]) => set({ variants: next });
  const addVar = () =>
    setVars([
      ...vars,
      { id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, color: '', colorHex: '#111111', size: '', stock: 0 },
    ]);
  const updateVar = (idx: number, patch: Partial<ProductVariant>) =>
    setVars(vars.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  const removeVar = (idx: number) => setVars(vars.filter((_, i) => i !== idx));

  const save = () => {
    const cleanComp = (draft.competitorPrices ?? []).filter((c) => c.price > 0 && c.source);
    // Keep only variants that carry a colour or a size.
    const cleanVars = (draft.variants ?? []).filter((v) => (v.color && v.colorHex) || v.size);
    const next: Product = {
      ...draft,
      competitorPrices: cleanComp.length ? cleanComp : undefined,
      variants: cleanVars.length ? cleanVars : undefined,
      // "Old price" is derived from the highest marketplace price so the
      // storefront shows the biggest saving vs marketplaces.
      oldPrice: cleanComp.length ? Math.max(...cleanComp.map((c) => c.price)) : undefined,
    };
    if (!next.slug || next.slug.startsWith('product-')) next.slug = slugify(next.name);
    if (isNew) addProduct(next);
    else updateProduct(product.id, next);
    notify('success');
    toast.success(t('itemSavedToast'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-brand-surface-border bg-brand-dark sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-brand-surface-border px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">
            {isNew ? t('prodAddBtn') : t('itemEditBtn')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/8 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-2.5 overflow-y-auto px-5 py-4 sm:grid-cols-2">
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
            <Input
              value={String(draft.price)}
              onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
            />
          </PF>
          <PF label={t('fldProdWeight')}>
            <Input
              value={draft.weight != null ? String(draft.weight) : ''}
              placeholder="0.5"
              inputMode="decimal"
              onChange={(e) => {
                const v = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                set({ weight: v === '' ? undefined : Number(v) });
              }}
            />
          </PF>

          {/* Marketplace prices */}
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">
                {t('fldProdMarketPrices')}
              </span>
              <button
                type="button"
                onClick={addComp}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow"
              >
                <Plus className="h-3 w-3" /> {t('fldProdAddMarket')}
              </button>
            </div>
            {comp.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-2.5 text-[11px] text-white/40">
                {t('fldProdMarketHint')}
              </p>
            ) : (
              <div className="space-y-3">
                {comp.map((c, i) => (
                  <div key={i} className="space-y-1.5 rounded-xl border border-brand-surface-border bg-brand-surface/40 p-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: (c.color || '#7B2CBF') + '22' }}>
                        <Store className="h-4 w-4" style={{ color: c.color || '#7B2CBF' }} />
                      </span>
                      <select
                        value={c.source}
                        onChange={(e) => pickMarketplace(i, e.target.value)}
                        className="h-11 w-36 shrink-0 rounded-xl border border-brand-surface-border bg-brand-surface px-3 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60"
                      >
                        {!marketplaces.some((m) => m.id === c.source) && (
                          <option value={c.source}>{c.label || '—'}</option>
                        )}
                        {marketplaces.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={c.price ? String(c.price) : ''}
                        placeholder={t('fldProdPrice')}
                        onChange={(e) => updateComp(i, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                      />
                      <button
                        type="button"
                        onClick={() => removeComp(i)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      value={c.url ?? ''}
                      placeholder={t('fldProdMarketLink')}
                      onChange={(e) => updateComp(i, { url: e.target.value || undefined })}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-white/40">{t('fldProdMarketDerive')}</p>
              </div>
            )}
          </div>

          {/* Variants — colour / size / stock */}
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">
                {t('fldProdVariants')}
              </span>
              <button
                type="button"
                onClick={addVar}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow"
              >
                <Plus className="h-3 w-3" /> {t('fldProdAddVariant')}
              </button>
            </div>
            {vars.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-2.5 text-[11px] text-white/40">
                {t('fldProdVariantHint')}
              </p>
            ) : (
              <div className="space-y-2">
                {vars.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface/40 p-2">
                    <input
                      type="color"
                      value={v.colorHex || '#111111'}
                      onChange={(e) => updateVar(i, { colorHex: e.target.value })}
                      aria-label={t('fldProdVarColorName')}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-brand-surface-border bg-transparent"
                    />
                    <Input
                      value={v.color ?? ''}
                      placeholder={t('fldProdVarColorName')}
                      onChange={(e) => updateVar(i, { color: e.target.value })}
                    />
                    <Input
                      value={v.size ?? ''}
                      placeholder={t('fldProdVarSize')}
                      className="w-20 shrink-0"
                      onChange={(e) => updateVar(i, { size: e.target.value || undefined })}
                    />
                    <Input
                      value={v.stock ? String(v.stock) : ''}
                      placeholder={t('fldProdVarStock')}
                      inputMode="numeric"
                      className="w-20 shrink-0"
                      onChange={(e) => updateVar(i, { stock: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                    />
                    <button
                      type="button"
                      onClick={() => removeVar(i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-white/40">{t('fldProdVariantDerive')}</p>
              </div>
            )}
          </div>

          <PF label={t('fldProdBadges')} full>
            <Input
              value={(draft.badges ?? []).join(', ')}
              onChange={(e) => set({ badges: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
            />
          </PF>
          <PF label={t('fldProdDesc')} full>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60"
            />
          </PF>

          {/* Images */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
              {t('fldProdImage')}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {draft.images.map((img, i) => (
                <span key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
                  <ProductImage src={img} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
                  {i === 0 && (
                    <span className="absolute left-0 top-0 bg-brand-yellow px-1 text-[8px] font-bold text-brand-dark">
                      {t('mainImageBadge')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white hover:bg-danger"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-brand-surface-border text-white/60 hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span className="text-[9px]">{uploading ? '…' : t('uploadImageBtn')}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addImages} />
            </div>
          </div>

          {/* Video */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
              {t('fldProdVideo')}
            </span>
            {draft.video ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-xl border border-brand-surface-border bg-brand-dark">
                  {/youtu\.?be/.test(draft.video) ? (
                    <div className="px-3 py-2 text-xs text-white/70">YouTube: {draft.video}</div>
                  ) : (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={draft.video} controls className="max-h-48 w-full bg-black" />
                  )}
                  <button
                    type="button"
                    onClick={() => set({ video: undefined })}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded bg-black/70 text-white hover:bg-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  disabled={videoUploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-surface-border px-3 py-2.5 text-sm font-semibold text-white/70 hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {videoUploading ? '…' : t('fldProdVideoUpload')}
                </button>
                <Input
                  value={draft.video ?? ''}
                  placeholder={t('fldProdVideoUrl')}
                  onChange={(e) => set({ video: e.target.value || undefined })}
                />
              </div>
            )}
            <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={addVideoFile} />
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <Toggle checked={draft.inStock} onChange={(v) => set({ inStock: v })} label={t('fldProdInStock')} />
            <Toggle checked={Boolean(draft.isNew)} onChange={(v) => set({ isNew: v })} label={t('fldProdNew')} />
            <Toggle checked={Boolean(draft.isBestseller)} onChange={(v) => set({ isBestseller: v })} label={t('fldProdBestseller')} />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-brand-surface-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-brand-surface-border px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
          >
            {t('cancelBtn')}
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-5 py-2.5 text-sm font-bold text-brand-dark shadow-glow-sm hover:brightness-110"
          >
            <Check className="h-4 w-4" /> {t('itemSaveBtn')}
          </button>
        </footer>
      </div>
    </div>
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
