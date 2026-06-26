'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up';
  delay?: number;
  className?: string;
}

const OFFSET = {
  left: { x: -56, y: 0 },
  right: { x: 56, y: 0 },
  up: { x: 0, y: 36 },
};

export function Reveal({ children, direction = 'up', delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = OFFSET[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
