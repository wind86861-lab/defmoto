'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/format';
import { mockProducts } from '@/mocks/products';
import { mockCategories } from '@/mocks/categories';
import type { Product } from '@/types/product';

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tCategories = useTranslations('categories');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockProducts.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q))
        return false;
      if (categoryFilter && p.categorySlug !== categoryFilter) return false;
      if (stockFilter === 'in' && !p.inStock) return false;
      if (stockFilter === 'out' && p.inStock) return false;
      return true;
    });
  }, [query, categoryFilter, stockFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navProducts')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('totalLabel')} <span className="font-bold text-white">{mockProducts.length}</span> {t('productUnit', { count: mockProducts.length })} ·{' '}
            {t('filteredLabel')} <span className="font-bold text-brand-yellow">{filtered.length}</span>
          </p>
        </div>
        <Button size="md" glow leftIcon={<Plus className="h-4 w-4" />}>
          {t('newProductButton')}
        </Button>
      </header>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_180px]">
        <Input
          placeholder={t('productSearchPlaceholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-12 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60"
        >
          <option value="">{t('allCategoriesOption')}</option>
          {mockCategories.map((c) => (
            <option key={c.id} value={c.slug}>
              {tCategories(c.slug)}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="h-12 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60"
        >
          <option value="all">{t('stockAllOption')}</option>
          <option value="in">{t('stockInOption')}</option>
          <option value="out">{t('stockOutOption')}</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 animate-fade-in">
          <span className="text-sm font-bold text-brand-yellow">
            {t('selectedCountText', { count: selected.size })}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Filter className="h-3 w-3" />}>
              {t('changeStockButton')}
            </Button>
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="h-3 w-3" />}>
              {t('bulkDeleteButton')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              {tCommon('cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Table — desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface lg:block">
        <table className="w-full">
          <thead className="bg-brand-dark/40 text-left text-[11px] font-bold uppercase tracking-wider text-white/45">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-brand-yellow"
                />
              </th>
              <th className="px-4 py-3">{t('tableHeadProduct')}</th>
              <th className="px-4 py-3">{t('tableHeadCategory')}</th>
              <th className="px-4 py-3">{t('tableHeadPrice')}</th>
              <th className="px-4 py-3">{t('tableHeadStatus')}</th>
              <th className="px-4 py-3">{t('tableHeadRating')}</th>
              <th className="px-4 py-3 text-right">{t('tableHeadActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-surface-border">
            {filtered.map((p) => (
              <Row
                key={p.id}
                product={p}
                selected={selected.has(p.id)}
                onToggle={() => toggleSelect(p.id)}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-white/45">
            {t('noProductsFoundText')}
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="space-y-2 lg:hidden">
        {filtered.map((p) => (
          <MobileCard
            key={p.id}
            product={p}
            selected={selected.has(p.id)}
            onToggle={() => toggleSelect(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  product,
  selected,
  onToggle,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('admin');
  const tCategories = useTranslations('categories');

  return (
    <tr className={cn('transition-colors hover:bg-white/3', selected && 'bg-brand-yellow/5')}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 cursor-pointer accent-brand-yellow"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
            fallbackClassName="h-12 w-12 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            {product.brand && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                {product.brand}
              </p>
            )}
            <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-white/65">{tCategories(product.categorySlug)}</td>
      <td className="px-4 py-3">
        <div className="font-display text-sm font-extrabold text-brand-yellow">
          {formatPrice(product.price)}
        </div>
        {product.oldPrice && (
          <div className="text-[10px] text-white/35 line-through">
            {formatPrice(product.oldPrice)}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {product.inStock ? (
          <Badge variant="success" size="sm">
            {t('stockInOption')}
          </Badge>
        ) : (
          <Badge variant="danger" size="sm">
            {t('stockOutOption')}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        {typeof product.rating === 'number' ? (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" />
            <span className="font-semibold">{product.rating}</span>
            <span className="text-[11px] text-white/45">({product.reviewCount})</span>
          </div>
        ) : (
          <span className="text-xs text-white/35">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-brand-yellow"
            aria-label={t('viewOnSiteAria')}
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-brand-yellow"
            aria-label={t('editAria')}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-danger/15 hover:text-danger"
            aria-label={t('deleteAria')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileCard({
  product,
  selected,
  onToggle,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('admin');

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-brand-surface p-3 transition-colors',
        selected ? 'border-brand-yellow bg-brand-yellow/5' : 'border-brand-surface-border',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 cursor-pointer accent-brand-yellow"
      />
      <ProductImage
        src={product.images[0]}
        alt={product.name}
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
        fallbackClassName="h-14 w-14 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            {product.brand}
          </p>
        )}
        <p className="line-clamp-2 text-sm font-semibold leading-tight">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-display text-sm font-extrabold text-brand-yellow">
            {formatPrice(product.price)}
          </span>
          {product.inStock ? (
            <Badge variant="success" size="sm">
              {t('stockInOption')}
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              {t('stockOutOption')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
