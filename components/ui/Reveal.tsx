'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up';
  delay?: number; // seconds
  className?: string;
}

const animationClass: Record<NonNullable<RevealProps['direction']>, string> = {
  up: 'animate-reveal-up',
  left: 'animate-reveal-left',
  right: 'animate-reveal-right',
};

/**
 * Scroll-reveal wrapper — plays a fade/slide-in animation the first time the
 * element enters the viewport.
 *
 * Deliberately "visible by default": the content has no hidden state until an
 * IntersectionObserver confirms it's entering view and adds the animation
 * class (which itself starts at opacity 0 → 1). So if JS, hydration or the
 * observer ever fail, the content simply stays visible — it can never get
 * stuck invisible. Reduced-motion users get no animation, just the content.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setAnimate(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={animate && delay ? { animationDelay: `${delay}s` } : undefined}
      className={cn(animate && animationClass[direction], className)}
    >
      {children}
    </div>
  );
}
