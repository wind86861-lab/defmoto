'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Display string like "10K+", "5+", "24/7". Leading digits animate 0→N. */
  value: string;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

// Split "10K+" → prefix "", number 10, suffix "K+". A value with no leading
// digits (rare) animates nothing and just renders as-is.
function parse(value: string): { prefix: string; target: number; suffix: string } {
  const m = /^(\D*)(\d+)(.*)$/.exec(value);
  if (!m) return { prefix: value, target: 0, suffix: '' };
  return { prefix: m[1], target: Number(m[2]), suffix: m[3] };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts the numeric part of a stat up from 0 when it first scrolls into view.
 * Honours prefers-reduced-motion (shows the final value immediately) and only
 * ever runs once per mount.
 */
export function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const { prefix, target, suffix } = parse(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) {
      setDisplay(target);
      started.current = true;
      return;
    }

    const run = () => {
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setDisplay(Math.round(easeOut(p) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
