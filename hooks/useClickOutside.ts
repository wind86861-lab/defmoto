'use client';

import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;

    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOutside();
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onOutside, active]);
}
