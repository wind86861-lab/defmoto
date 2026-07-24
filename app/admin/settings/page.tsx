'use client';

import { useRef, useState } from 'react';
import { Settings, Check, Plus, Trash2, Phone, MapPin, Clock, Send, Truck, Upload, Award, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { TrInput } from '@/components/admin/TrInput';
import type { DeliveryTerm } from '@/lib/stores/siteSettings';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { uploadImage } from '@/lib/uploadImage';

export default function AdminSettingsPage() {
  const mounted = useMounted();
  const { notify } = useHaptic();
  const contact = useSiteSettings((s) => s.contact);
  const setContact = useSiteSettings((s) => s.setContact);
  const deliveryTerms = useSiteSettings((s) => s.deliveryTerms);
  const setDeliveryTerms = useSiteSettings((s) => s.setDeliveryTerms);
  const partners = useSiteSettings((s) => s.partners);
  const addPartner = useSiteSettings((s) => s.addPartner);
  const updatePartner = useSiteSettings((s) => s.updatePartner);
  const removePartner = useSiteSettings((s) => s.removePartner);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const logoUploadFor = useRef<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const flash = () => {
    setSavedAt(new Date().toLocaleTimeString('en-GB'));
    setTimeout(() => setSavedAt(null), 2000);
  };

  const pickLogo = (id: string) => {
    logoUploadFor.current = id;
    logoInput.current?.click();
  };
  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const id = logoUploadFor.current;
    if (!file || !id) return;
    try {
      updatePartner(id, { logo: await uploadImage(file) });
      flash();
    } catch {
      /* ignore */
    }
  };

  const updateTerm = (i: number, patch: Partial<DeliveryTerm>) => {
    setDeliveryTerms(deliveryTerms.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  };
  const addTerm = () => setDeliveryTerms([...deliveryTerms, { title: '', text: '' }]);
  const removeTerm = (i: number) => setDeliveryTerms(deliveryTerms.filter((_, idx) => idx !== i));

  if (!mounted) return null;

  const field = (
    label: string,
    key: 'tagline' | 'phone' | 'address' | 'workingHours' | 'telegram' | 'whatsapp' | 'instagram' | 'viber',
    placeholder: string,
    icon?: React.ReactNode,
  ) => (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</label>
      <Input
        value={contact[key] ?? ''}
        onChange={(e) => setContact({ [key]: e.target.value })}
        onBlur={flash}
        placeholder={placeholder}
        leftIcon={icon}
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
            <Settings className="h-6 w-6 text-brand-yellow" />
            Sayt sozlamalari
          </h1>
          <p className="mt-1 text-sm text-white/55">Footer (aloqa, ijtimoiy tarmoqlar) va yetkazib berish shartlari.</p>
        </div>
        {savedAt && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
            <Check className="h-3.5 w-3.5" /> Saqlandi
          </span>
        )}
      </header>

      {/* Footer / contact */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">Footer — aloqa</h2>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Tavsif (tagline)</label>
          <textarea
            value={contact.tagline ?? ''}
            onChange={(e) => setContact({ tagline: e.target.value })}
            onBlur={flash}
            rows={2}
            className="w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-yellow/60"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('Telefon', 'phone', '+998 99 810-70-90', <Phone className="h-4 w-4" />)}
          {field('Ish vaqti', 'workingHours', 'Du-Sh: 09:00 — 20:00', <Clock className="h-4 w-4" />)}
        </div>
        {field('Manzil', 'address', "Toshkent, ... ko'chasi", <MapPin className="h-4 w-4" />)}
      </section>

      {/* Socials */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">Ijtimoiy tarmoqlar</h2>
        <p className="text-[11px] text-white/40">Havola yoki foydalanuvchi nomi (@ bilan). Bo'sh qoldirilsa — ko'rinmaydi.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('Telegram', 'telegram', '@deftmoto yoki https://t.me/...', <Send className="h-4 w-4" />)}
          {field('WhatsApp', 'whatsapp', '998998107090', undefined)}
          {field('Instagram', 'instagram', '@deftmoto', undefined)}
          {field('Viber', 'viber', '998998107090', undefined)}
        </div>
      </section>

      {/* Delivery terms */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
            <Truck className="h-4 w-4 text-brand-yellow" /> Yetkazib berish shartlari
          </h2>
          <button
            type="button"
            onClick={() => {
              addTerm();
              notify('success');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow"
          >
            <Plus className="h-3 w-3" /> Qator qo'shish
          </button>
        </div>
        <p className="text-[11px] text-white/40">Barcha mahsulotlar uchun bir xil — mahsulot sahifasidagi "Yetkazib berish" bo'limida chiqadi.</p>
        <div className="space-y-2">
          {deliveryTerms.map((d, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-brand-surface-border bg-brand-surface/40 p-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input value={d.title} placeholder="Sarlavha (masalan: Toshkent ichida)" onChange={(e) => updateTerm(i, { title: e.target.value })} onBlur={flash} />
                <Input value={d.text} placeholder="Matn (masalan: 1-2 ish kuni • Bepul)" onChange={(e) => updateTerm(i, { text: e.target.value })} onBlur={flash} />
                <TrInput tr={d.tr} field="title" base={d.title} onChange={(tr) => updateTerm(i, { tr })} />
                <TrInput tr={d.tr} field="text" base={d.text} onChange={(tr) => updateTerm(i, { tr })} />
              </div>
              <button
                type="button"
                onClick={() => removeTerm(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Partner brands (home page) */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
            <Award className="h-4 w-4 text-brand-yellow" /> Hamkor brendlar (bosh sahifa)
          </h2>
          <button
            type="button"
            onClick={() => {
              addPartner({ id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: '', tagline: '' });
              notify('success');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-bold text-white/75 hover:border-brand-yellow/40 hover:text-brand-yellow"
          >
            <Plus className="h-3 w-3" /> Brend qo'shish
          </button>
        </div>
        <p className="text-[11px] text-white/40">Bo'sh qoldirilsa — standart brendlar ko'rinadi. Bittasi qo'shilsa, faqat siznikilar chiqadi.</p>
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface/40 p-2">
              <button
                type="button"
                onClick={() => pickLogo(p.id)}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-surface-border bg-brand-dark text-white/50 hover:border-brand-yellow/40"
              >
                {p.logo ? (
                  <ProductImage src={p.logo} alt="" className="h-full w-full object-contain p-1" fallbackClassName="h-full w-full" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input value={p.name} placeholder="Brend nomi (masalan: Yamaha)" onChange={(e) => updatePartner(p.id, { name: e.target.value })} onBlur={flash} />
                <Input value={p.tagline ?? ''} placeholder="Shior (ixtiyoriy)" onChange={(e) => updatePartner(p.id, { tagline: e.target.value })} onBlur={flash} />
                <TrInput tr={p.tr} field="tagline" base={p.tagline ?? ''} onChange={(tr) => updatePartner(p.id, { tr })} />
              </div>
              <button
                type="button"
                onClick={() => removePartner(p.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 hover:bg-danger/15 hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onLogoFile} />
      </section>
    </div>
  );
}
