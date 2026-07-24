'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Optional leading icon inside the trigger. */
  icon?: React.ReactNode;
}

/**
 * Styled dropdown that replaces the native <select> — the popup is themed and
 * animated (native selects render an OS dropdown that ignores our styling).
 * The listbox is portaled to <body> and positioned under the trigger so it
 * never clips inside scroll containers.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = '—',
  disabled,
  className,
  icon,
}: SelectProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  const toggle = () => {
    if (disabled) return;
    if (!open) place();
    setOpen((o) => !o);
  };

  useClickOutside(wrapRef, () => setOpen(false), open);

  // Reposition while open (scroll/resize).
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border-2 border-brand-surface-border bg-brand-surface px-3.5 py-3 text-left text-sm font-semibold text-white outline-none transition-colors',
          'focus:border-brand-yellow/60 disabled:opacity-40',
          open && 'border-brand-yellow/60',
          className,
        )}
      >
        {icon && <span className="shrink-0 text-brand-yellow">{icon}</span>}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-white/40')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-white/50 transition-transform', open && 'rotate-180 text-brand-yellow')}
        />
      </button>

      {mounted &&
        open &&
        rect &&
        createPortal(
          <div
            style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 200 }}
            className="max-h-72 overflow-y-auto rounded-xl border border-brand-surface-border bg-brand-dark p-1 shadow-card-hover backdrop-blur-xl animate-fade-in scrollbar-hide"
            role="listbox"
          >
            {options.length === 0 && (
              <p className="px-3 py-2 text-xs text-white/40">—</p>
            )}
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(o.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    active ? 'bg-brand-yellow/15 font-bold text-brand-yellow' : 'text-white/80 hover:bg-white/6 hover:text-white',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {o.label}
                    {o.hint && <span className="ml-1 text-white/40">· {o.hint}</span>}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
