'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { PaymentProcessor } from '@/features/payment/PaymentProcessor';
import { paymentProviders } from '@/types/payment';
import type { PaymentMethod } from '@/types/order';
import type { PaymentRequest } from '@/types/payment';

// Internal dev-only preview of PaymentProcessor for screenshot/QA.
export default function PaymentPreviewPage() {
  const [open, setOpen] = useState<PaymentMethod | null>(null);

  const req = (method: PaymentMethod): PaymentRequest => ({
    orderId: 'preview',
    orderNumber: 'DM-PREVIEW',
    amount: 890_000,
    method,
    phone: '+998 90 000 00 00',
    description: 'Preview',
  });

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-display-md font-extrabold">
          Payment preview
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Internal QA screen for PaymentProcessor modal.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(Object.keys(paymentProviders) as PaymentMethod[]).map((m) => {
            const p = paymentProviders[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setOpen(m)}
                className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4 text-left transition-all hover:border-brand-yellow/40 hover:shadow-card-hover"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl font-display text-sm font-extrabold text-white"
                  style={{ background: p.bgGradient }}
                >
                  {p.icon}
                </div>
                <div>
                  <div className="font-display text-base font-bold">{p.name}</div>
                  <div className="text-xs text-white/55">{p.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {open && (
          <PaymentProcessor
            open={Boolean(open)}
            request={req(open)}
            onClose={() => setOpen(null)}
          />
        )}
      </div>
    </PageShell>
  );
}
