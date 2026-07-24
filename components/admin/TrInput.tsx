'use client';

import { Input } from '@/components/ui/Input';
import { setTr, type TrMap } from '@/lib/i18nField';

interface TrInputProps {
  /** Current translation map of the record being edited. */
  tr: TrMap | undefined;
  /** Field name being translated (must match the base field, e.g. "name"). */
  field: string;
  /** The Uzbek base value — shown as placeholder so the admin sees the source. */
  base?: string;
  /** Receives the updated translation map. */
  onChange: (next: TrMap) => void;
  /** Render multi-line inputs (for descriptions / long text). */
  textarea?: boolean;
  rows?: number;
}

const LOCALES = [
  { code: 'ru' as const, label: 'Русский 🇷🇺' },
  { code: 'en' as const, label: 'English 🇬🇧' },
];

const areaCls =
  'w-full rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-base text-white outline-none focus:border-brand-yellow/60';

/**
 * RU + EN inputs for one translatable field. The Uzbek base stays in its own
 * field above; empty translations fall back to it at render time.
 */
export function TrInput({ tr, field, base, onChange, textarea, rows = 2 }: TrInputProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {LOCALES.map(({ code, label }) => {
        const value = tr?.[code]?.[field] ?? '';
        const handle = (v: string) => onChange(setTr(tr, code, field, v));
        return (
          <label key={code} className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/35">
              {label}
            </span>
            {textarea ? (
              <textarea
                value={value}
                placeholder={base}
                rows={rows}
                onChange={(e) => handle(e.target.value)}
                className={areaCls}
              />
            ) : (
              <Input value={value} placeholder={base} onChange={(e) => handle(e.target.value)} />
            )}
          </label>
        );
      })}
    </div>
  );
}
