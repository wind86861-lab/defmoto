'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info, ShoppingBag, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastVariant =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'cart'
  | 'wishlist';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const t: Toast = { id, duration: 3500, ...toast };
    set({ toasts: [...get().toasts, t] });
    if (t.duration && t.duration > 0) {
      setTimeout(() => get().dismiss(id), t.duration);
    }
    return id;
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Helper hook with convenience methods.
export function useToast() {
  const show = useToastStore((s) => s.show);

  return {
    show,
    success: (title: string, description?: string) =>
      show({ variant: 'success', title, description }),
    error: (title: string, description?: string) =>
      show({ variant: 'error', title, description }),
    info: (title: string, description?: string) =>
      show({ variant: 'info', title, description }),
    warning: (title: string, description?: string) =>
      show({ variant: 'warning', title, description }),
    cart: (title: string, description?: string, action?: Toast['action']) =>
      show({ variant: 'cart', title, description, action }),
    wishlist: (title: string, description?: string) =>
      show({ variant: 'wishlist', title, description }),
  };
}

const variantMeta: Record<
  ToastVariant,
  { icon: ReactNode; ring: string; bar: string }
> = {
  success: {
    icon: <Check className="h-4 w-4" strokeWidth={3} />,
    ring: 'border-success/45 bg-success/10 text-success',
    bar: 'bg-success',
  },
  error: {
    icon: <AlertTriangle className="h-4 w-4" />,
    ring: 'border-danger/45 bg-danger/10 text-danger',
    bar: 'bg-danger',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    ring: 'border-warning/45 bg-warning/10 text-warning',
    bar: 'bg-warning',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    ring: 'border-info/45 bg-info/10 text-info',
    bar: 'bg-info',
  },
  cart: {
    icon: <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />,
    ring: 'border-brand-yellow/45 bg-brand-yellow/10 text-brand-yellow',
    bar: 'bg-gradient-yellow',
  },
  wishlist: {
    icon: <Heart className="h-4 w-4 fill-current" />,
    ring: 'border-brand-yellow/45 bg-brand-yellow/10 text-brand-yellow',
    bar: 'bg-gradient-yellow',
  },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[200] flex flex-col items-center gap-2 px-3 safe-top sm:top-4 sm:right-4 sm:left-auto sm:items-end"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const t = useTranslations('common');
  const meta = variantMeta[toast.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="pointer-events-auto w-full max-w-sm"
    >
      <div
        className={cn(
          'relative flex items-start gap-3 overflow-hidden rounded-2xl border bg-brand-surface/95 px-4 py-3 shadow-card-hover backdrop-blur-xl',
          meta.ring,
        )}
      >
        {/* Side accent bar */}
        <span className={cn('absolute inset-y-0 left-0 w-1', meta.bar)} />

        {/* Icon */}
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.ring)}>
          {meta.icon}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-xs leading-snug text-white/65">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                onDismiss();
              }}
              className="mt-2 text-xs font-bold text-brand-yellow underline-offset-2 hover:underline"
            >
              {toast.action.label} →
            </button>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('close')}
          className="-mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/8 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
