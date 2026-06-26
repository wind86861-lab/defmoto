'use client';

import { useState } from 'react';
import { MotoLoader, FullScreenLoader } from '@/components/ui/MotoLoader';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

export default function LoadersPreviewPage() {
  const [overlay, setOverlay] = useState(false);

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="font-display text-display-md font-extrabold sm:text-display-lg">
            Premium moto loader
          </h1>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            Haqiqiy sport-bayk PNG · sariq glow halo · tezlik chiziqlari · shimmering label
          </p>
        </header>

        {/* Size showcase */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <article
              key={size}
              className="flex flex-col items-center rounded-3xl border border-brand-surface-border bg-brand-surface p-6"
            >
              <div className="flex flex-1 items-center justify-center">
                <MotoLoader size={size} label="Yuklanmoqda" />
              </div>
              <span className="mt-4 rounded-full bg-brand-yellow/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
                size = &quot;{size}&quot;
              </span>
            </article>
          ))}
        </div>

        {/* Full screen test */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              setOverlay(true);
              setTimeout(() => setOverlay(false), 3000);
            }}
          >
            Full-screen sinov (3 sek)
          </Button>
        </div>

        {/* Recommendation */}
        <div className="mt-10 rounded-3xl border border-brand-yellow/30 bg-gradient-to-br from-brand-surface to-brand-dark p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">
            💡 Loader detallari
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>· Haqiqiy <strong className="text-brand-yellow">sport-bayk PNG</strong> markazda nafis nafas oladi</li>
            <li>· Sariq <strong className="text-brand-yellow">glow halo</strong> orqasida pulsatsiya qiladi (2s)</li>
            <li>· Ikki qatlamli <strong className="text-brand-yellow">aylanuvchi nuqtali halqa</strong> (6s + 8s reverse)</li>
            <li>· 6 ta <strong className="text-brand-yellow">tezlik chiziqlari</strong> ketma-ket o&apos;tib turadi</li>
            <li>· Mototsikl ostida <strong className="text-brand-yellow">yer aks-glow</strong></li>
            <li>· Sariq <strong className="text-brand-yellow">shimmering matn</strong> (text-clip gradient)</li>
            <li>· Drop shadow + sariq glow filtri (premium chuqurlik)</li>
          </ul>
        </div>
      </div>

      {overlay && <FullScreenLoader label="Yuklanmoqda" />}
    </PageShell>
  );
}
