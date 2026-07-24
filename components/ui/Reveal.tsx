'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up';
  /** Extra delay in seconds (added on top of the base per-element delay). */
  delay?: number;
  className?: string;
}

// Base delay applied to every reveal so each element eases in a touch later
// (feels smoother than firing instantly the moment it scrolls into view).
const BASE_DELAY_MS = 120;
// Hard safety net: content must NEVER stay invisible. If the observer never
// fires (unsupported, zero-size element, animation lib hiccup, ...) we show it.
const FAILSAFE_MS = 1200;

const HIDDEN_OFFSET: Record<NonNullable<RevealProps['direction']>, string> = {
  up: 'translate-y-6',
  left: '-translate-x-6',
  right: 'translate-x-6',
};

/**
 * Scroll-reveal wrapper. Fades + slides children in the first time they scroll
 * into view, then stays visible.
 *
 * Deliberately dependency-free: the previous react-awesome-reveal version could
 * leave a block stuck at opacity 0 (the branches page rendered its detail into
 * the DOM but showed a blank area). This version defaults to visible on any
 * failure path and has a failsafe timer, so content can never be swallowed.
 */
export function Reveal({ children, direction = 'up', delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    const failsafe = setTimeout(() => setShown(true), FAILSAFE_MS);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            revealTimer = setTimeout(() => setShown(true), BASE_DELAY_MS + delay * 1000);
            io.disconnect();
            clearTimeout(failsafe);
          }
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-spring motion-reduce:transition-none',
        shown
          ? 'translate-x-0 translate-y-0 opacity-100'
          : cn('opacity-0', HIDDEN_OFFSET[direction]),
        className,
      )}
    >
      {children}
    </div>
  );
}
