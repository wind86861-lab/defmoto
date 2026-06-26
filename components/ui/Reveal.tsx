'use client';

import type { ReactNode } from 'react';
import { Fade } from 'react-awesome-reveal';

interface RevealProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up';
  /** Extra delay in seconds (added on top of the base per-element delay). */
  delay?: number;
  className?: string;
}

// Base delay applied to every reveal so each element eases in a touch later
// (feels smoother than firing instantly the moment it scrolls into view).
const BASE_DELAY_MS = 200;

/**
 * Scroll-reveal wrapper powered by react-awesome-reveal.
 *
 * Keeps the original API (direction / delay / className) so every existing
 * call site keeps working. Fades + slides children in from the given side the
 * first time they scroll into view (triggerOnce).
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
}: RevealProps) {
  return (
    <Fade
      direction={direction}
      delay={BASE_DELAY_MS + delay * 1000}
      duration={850}
      fraction={0.12}
      triggerOnce
      className={className}
    >
      {children}
    </Fade>
  );
}
