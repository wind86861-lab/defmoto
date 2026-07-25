'use client';

import { useState } from 'react';
import { BadgePercent, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useContentStore } from '@/lib/stores/content';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { integerOnly } from '@/lib/phoneInput';
import type { PromoCode } from '@/lib/promo';

const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55';

export default function AdminPromosPage() {
  const mounted = useMounted();
  const { notify } = useHaptic();
  const toast = useToast();
  const promoCodes = useContentStore((s) => s.promoCodes);
  const addPromoCode = useContentStore((s) => s.addPromoCode);
  const removePromoCode = useContentStore((s) => s.removePromoCode);

  const [draft, setDraft] = useState<PromoCode>({
    code: '',
    type: 'percent',
    value: 10,
    minSubtotal: undefined,
    description: '',
  });

  const list = mounted ? promoCodes : [];

  const save = () => {
    const code = draft.code.trim().toUpperCase();
    if (!code) {
      toast.error("Kod bo'sh", 'Promokod nomini kiriting.');
      return;
    }
    if (list.some((p) => p.code === code)) {
      toast.error('Mavjud', 'Bu kod allaqachon qo‘shilgan.');
      return;
    }
    if (!(draft.value > 0)) {
      toast.error("Qiymat noto'g'ri", 'Chegirma qiymatini kiriting.');
      return;
    }
    addPromoCode({
      code,
      type: draft.type,
      value: draft.value,
      minSubtotal: draft.minSubtotal && draft.minSubtotal > 0 ? draft.minSubtotal : undefined,
      description:
        draft.description.trim() ||
        (draft.type === 'percent'
          ? `${draft.value}% chegirma`
          : `${draft.value.toLocaleString('ru-RU')} so'm chegirma`),
    });
    notify('success');
    toast.success('Saqlandi', `${code} qo‘shildi.`);
    setDraft({ code: '', type: 'percent', value: 10, minSubtotal: undefined, description: '' });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
          <BadgePercent className="h-6 w-6 text-brand-yellow" /> Promokodlar
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Faqat shu yerda qo&#8216;shilgan kodlar ishlaydi. Har biriga minimal buyurtma summasini
          belgilashingiz mumkin — undan kam bo&#8216;lsa kod qo&#8216;llanmaydi.
        </p>
      </header>

      {/* Add form */}
      <section className="space-y-3 rounded-2xl border border-brand-yellow/30 bg-brand-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Kod</span>
            <Input
              value={draft.code}
              placeholder="MOTO20"
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().slice(0, 24) })}
            />
          </label>
          <label>
            <span className={labelCls}>Turi</span>
            <Select
              value={draft.type}
              onChange={(v) => setDraft({ ...draft, type: v as PromoCode['type'] })}
              options={[
                { value: 'percent', label: 'Foiz (%)' },
                { value: 'fixed', label: "So'mda (belgilangan)" },
              ]}
            />
          </label>
          <label>
            <span className={labelCls}>{draft.type === 'percent' ? 'Chegirma (%)' : "Chegirma (so'm)"}</span>
            <Input
              value={String(draft.value || '')}
              inputMode="numeric"
              placeholder={draft.type === 'percent' ? '20' : '50000'}
              onChange={(e) => setDraft({ ...draft, value: Number(integerOnly(e.target.value)) })}
            />
          </label>
          <label>
            <span className={labelCls}>Minimal buyurtma (so&#8216;m) — ixtiyoriy</span>
            <Input
              value={draft.minSubtotal ? String(draft.minSubtotal) : ''}
              inputMode="numeric"
              placeholder="100000"
              onChange={(e) =>
                setDraft({ ...draft, minSubtotal: Number(integerOnly(e.target.value)) || undefined })
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelCls}>Tavsif — ixtiyoriy</span>
            <Input
              value={draft.description}
              placeholder="20% chegirma (1 mln+)"
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-4 py-2.5 text-sm font-bold text-brand-dark shadow-glow-sm hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Qo&#8216;shish
        </button>
      </section>

      {/* List */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-surface-border py-12 text-center">
          <BadgePercent className="mb-3 h-9 w-9 text-white/30" />
          <p className="text-sm font-semibold text-white/65">Hali promokod yo&#8216;q.</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
            <Info className="h-3.5 w-3.5" /> Yuqoridan qo&#8216;shing — foydalanuvchilar shu kodlarni kiritadi.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li
              key={p.code}
              className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/15 font-black text-brand-yellow">
                {p.type === 'percent' ? `${p.value}%` : '₮'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-extrabold">{p.code}</p>
                <p className="truncate text-xs text-white/55">
                  {p.type === 'percent'
                    ? `${p.value}% chegirma`
                    : `${p.value.toLocaleString('ru-RU')} so'm chegirma`}
                  {p.minSubtotal ? ` · min ${p.minSubtotal.toLocaleString('ru-RU')} so'm` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`${p.code} — o'chirilsinmi?`)) {
                    removePromoCode(p.code);
                    notify('success');
                  }
                }}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55',
                  'hover:bg-danger/15 hover:text-danger',
                )}
                aria-label="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
