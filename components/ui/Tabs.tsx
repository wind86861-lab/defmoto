'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  className?: string;
}

export function Tabs({ items, defaultKey, className }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);

  const current = items.find((i) => i.key === active);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative -mx-1 flex gap-1 overflow-x-auto border-b border-brand-surface-border px-1 scrollbar-hide">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={cn(
                'relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors touch-feedback',
                isActive ? 'text-brand-yellow' : 'text-white/55 hover:text-white',
              )}
            >
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span className="ml-1.5 text-xs text-white/40">({item.count})</span>
              )}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-brand-yellow shadow-glow-sm" />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-5 animate-fade-in" key={active}>
        {current?.content}
      </div>
    </div>
  );
}
