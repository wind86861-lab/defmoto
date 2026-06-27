'use client';

import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { cn } from '@/lib/cn';

interface MarketplaceLinksProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Marketplace badge links (Uzum, WB, Yandex …) shown in the navbar/footer.
 * Source list is admin-managed via the site-settings store.
 */
export function MarketplaceLinks({ className, size = 'sm' }: MarketplaceLinksProps) {
  const mounted = useMounted();
  const marketplaces = useSiteSettings((s) => s.marketplaces);

  const visible = (mounted ? marketplaces : []).filter((m) => m.enabled && m.url);
  if (visible.length === 0) return null;

  const box = size === 'sm' ? 'h-7' : 'h-9';

  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      {visible.map((m) =>
        m.icon ? (
          // Uploaded logo — shown on a neutral rounded tile
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={m.name}
            title={m.name}
            className={cn(
              'inline-flex aspect-square items-center justify-center overflow-hidden rounded-md bg-white shadow-sm transition-transform hover:-translate-y-0.5',
              box,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.icon} alt={m.name} className="h-full w-full object-contain p-0.5" />
          </a>
        ) : (
          // Colour + label badge fallback
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={m.name}
            title={m.name}
            style={{ background: m.color }}
            className={cn(
              'inline-flex items-center justify-center rounded-md font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5',
              size === 'sm' ? 'h-7 px-2 text-[11px]' : 'h-9 px-3 text-xs',
            )}
          >
            {m.label}
          </a>
        ),
      )}
    </div>
  );
}
