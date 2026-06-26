import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  align?: 'left' | 'center';
  accent?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel,
  className,
  align = 'left',
  accent,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-3',
        align === 'center' ? 'flex-col text-center' : 'justify-between',
        className,
      )}
    >
      <div className={align === 'center' ? 'mx-auto max-w-xl' : 'min-w-0'}>
        <h2
          className={cn(
            'font-display text-display-sm sm:text-display-md',
            accent && 'text-gradient-yellow',
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-white/55 sm:text-[15px]">{subtitle}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-yellow no-tap-highlight"
        >
          <span>{hrefLabel}</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
