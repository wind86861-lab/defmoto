'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useHaptic } from '@/hooks/useHaptic';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'bottom' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  side = 'bottom',
  children,
  footer,
}: SheetProps) {
  const { impact } = useHaptic();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          impact('light');
          onClose();
        }}
      />

      {/* Panel */}
      <div
        className={cn(
          'absolute flex flex-col border-brand-surface-border bg-brand-surface text-white shadow-2xl transition-transform duration-300 ease-spring',
          side === 'bottom' &&
            'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl border-t',
          side === 'bottom' && (open ? 'translate-y-0' : 'translate-y-full'),
          side === 'right' &&
            'inset-y-0 right-0 w-full max-w-md border-l sm:max-w-sm',
          side === 'right' && (open ? 'translate-x-0' : 'translate-x-full'),
        )}
      >
        {side === 'bottom' && (
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
        )}

        {(title || side === 'right') && (
          <header className="flex items-center justify-between gap-3 border-b border-brand-surface-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/8"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="border-t border-brand-surface-border bg-brand-dark/60 p-4 safe-bottom">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
