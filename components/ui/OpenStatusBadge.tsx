'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { isOpenNow } from '@/lib/workingHours';

export function OpenStatusBadge({ workingHours }: { workingHours: string }) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setOpen(isOpenNow(workingHours));
  }, [workingHours]);

  if (open === null) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        open ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-success' : 'bg-danger')} />
      {open ? "Hozir ochiq" : 'Hozir yopiq'}
    </span>
  );
}
