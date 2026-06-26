'use client';

import type { ReactNode, MouseEvent } from 'react';
import { Copy, type LucideIcon } from 'lucide-react';
import { useToast } from './Toaster';

interface ContactRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  copyable?: boolean;
  extra?: ReactNode;
}

export function ContactRow({ icon: Icon, label, value, href, copyable, extra }: ContactRowProps) {
  const toast = useToast();

  const handleCopy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    toast.success('Nusxalandi', value);
  };

  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            {label}
          </span>
          {extra}
        </div>
        <div className="flex items-center gap-1.5">
          {href ? (
            <a
              href={href}
              className="truncate text-sm text-white/90 transition-colors hover:text-brand-yellow"
            >
              {value}
            </a>
          ) : (
            <span className="truncate text-sm text-white/90">{value}</span>
          )}
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Nusxalash"
              className="shrink-0 rounded-md p-1 text-white/25 transition-colors hover:bg-white/5 hover:text-brand-yellow"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
