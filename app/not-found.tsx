'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Any unmatched URL (a mistyped or garbage link, e.g. a bad hero banner link)
// bounces the visitor to the home page instead of dead-ending on a 404 screen.
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
      <p className="text-sm text-white/55">…</p>
    </div>
  );
}
