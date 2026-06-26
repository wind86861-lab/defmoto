import { Construction } from 'lucide-react';

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow shadow-glow-sm">
        <Construction className="h-10 w-10" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-display-md font-extrabold text-gradient-yellow">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-white/55">
        {description ??
          "Bu bo'lim hozirda qurilmoqda. Tez orada to'liq funksional bo'ladi."}
      </p>
      <div className="mt-6 rounded-full border border-brand-surface-border bg-brand-surface px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
        Stage 2+ da quriladi
      </div>
    </div>
  );
}
