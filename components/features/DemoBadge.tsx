'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export function DemoBadge() {
  const t = useTranslations('demo');

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 xl:bottom-4">
      <div className="flex items-center gap-1.5 rounded-full border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-yellow backdrop-blur-md shadow-glow-sm">
        <Sparkles className="h-3 w-3" />
        {t('badge')}
      </div>
    </div>
  );
}
