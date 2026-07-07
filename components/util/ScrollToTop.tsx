'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scroll the window to the top on every route (pathname) change.
 *
 * Next.js already scrolls to top for most navigations, but not when the URL
 * stays on the same dynamic segment (e.g. /product/A → /product/B) — there the
 * page doesn't remount and the previous scroll position is kept. This makes the
 * behaviour consistent for all links. Anchor links (URLs with a #hash) are left
 * alone so in-page jumps still work.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash) return; // let anchor navigation handle it
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
