'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * Styled dropdown that replaces the native <select> — a native select renders
 * an OS popup that ignores our theme entirely.
 *
 * The listbox is portaled to <body> and positioned against the trigger, so it
 * never clips inside a scroll container, and it flips above the trigger when
 * there isn't room below. Fully keyboard-driven (arrows / Home / End / Enter /
 * Escape) with the active option scrolled into view on open.
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
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<
    { top: number; left: number; width: number; flip: boolean } | null
  >(null);
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  useEffect(() => setMounted(true), []);

  const selectedIdx = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);
  const selected = selectedIdx >= 0 ? options[selectedIdx] : undefined;

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const desired = Math.min(288, options.length * 44 + 12);
    const below = window.innerHeight - r.bottom;
    // Flip above only when there genuinely isn't room below but there is above.
    const flip = below < desired + 16 && r.top > below;
    setRect({
      top: flip ? r.top - 8 : r.bottom + 8,
      left: r.left,
      width: r.width,
      flip,
    });
  };

  const openMenu = () => {
    if (disabled) return;
    place();
    setActiveIdx(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  };

  const toggle = () => (open ? setOpen(false) : openMenu());

  useClickOutside(wrapRef, () => setOpen(false), open);

  // Reposition while open (scroll / resize).
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  // Keep the highlighted option visible.
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    listRef.current?.querySelectorAll('[role="option"]')[activeIdx]?.scrollIntoView({
      block: 'nearest',
    });
  }, [open, activeIdx]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIdx(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[activeIdx]) pick(options[activeIdx].value);
        break;
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'group flex h-12 w-full items-center gap-2.5 rounded-2xl border bg-brand-surface px-3.5 text-left text-sm font-semibold text-white outline-none transition-all duration-200',
          'disabled:cursor-not-allowed disabled:opacity-40',
          open
            ? 'border-brand-yellow shadow-glow-sm'
            : 'border-brand-surface-border hover:border-brand-yellow/40',
          className,
        )}
      >
        {icon && (
          <span
            className={cn(
              'shrink-0 transition-colors',
              open ? 'text-brand-yellow' : 'text-white/50 group-hover:text-brand-yellow',
            )}
          >
            {icon}
          </span>
        )}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'font-medium text-white/40')}>
          {selected ? selected.label : placeholder}
        </span>
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            open ? 'rotate-180 bg-brand-yellow text-brand-dark' : 'text-white/45 group-hover:text-white/70',
          )}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </button>

      {mounted &&
        open &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            style={{
              position: 'fixed',
              top: rect.flip ? undefined : rect.top,
              bottom: rect.flip ? window.innerHeight - rect.top : undefined,
              left: rect.left,
              width: rect.width,
              zIndex: 200,
            }}
            className={cn(
              'max-h-72 overflow-y-auto rounded-2xl border border-brand-yellow/25 bg-brand-dark/98 p-1.5 shadow-2xl backdrop-blur-xl scrollbar-hide',
              rect.flip ? 'origin-bottom' : 'origin-top',
              'animate-scale-in',
            )}
            role="listbox"
            tabIndex={-1}
            onKeyDown={onKeyDown}
          >
            {options.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-white/40">—</p>
            )}
            {options.map((o, i) => {
              const isSelected = o.value === value;
              const isActive = i === activeIdx;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(o.value)}
                  className={cn(
                    'relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150',
                    isSelected
                      ? 'bg-brand-yellow/15 font-bold text-brand-yellow'
                      : isActive
                        ? 'bg-white/8 text-white'
                        : 'text-white/75',
                  )}
                >
                  {/* Accent bar marks the highlighted row */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-all',
                      isSelected ? 'bg-brand-yellow' : isActive ? 'bg-white/30' : 'bg-transparent',
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {o.label}
                    {o.hint && <span className="ml-1 font-normal text-white/40">· {o.hint}</span>}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
