'use client';

import { useEffect, useState } from 'react';
import { Inbox, Phone } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

interface Lead {
  id: string;
  type: string;
  name?: string;
  phone: string;
  message?: string;
  meta?: Record<string, string>;
  createdAt: number;
}

const TYPE_LABEL: Record<string, string> = {
  product: '🔎 Maxsus so‘rov',
  branch: '🏢 Filial',
  service: '🔧 Servis',
  franchise: '⭐️ Franshiza',
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lead', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLeads(d?.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
          <Inbox className="h-6 w-6 text-brand-yellow" />
          So‘rovlar
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Saytdagi formalar orqali kelgan mijoz so‘rovlari (maxsus tovar, servis, filial, franshiza).
          Har biri Telegram guruhga ham yuboriladi.
        </p>
      </header>

      <div className="space-y-2.5">
        {loading ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Yuklanmoqda...
          </p>
        ) : leads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-8 text-center text-sm text-white/45">
            Hali so‘rov yo‘q.
          </p>
        ) : (
          leads.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-brand-yellow/15 px-2 py-0.5 text-[11px] font-bold text-brand-yellow">
                  {TYPE_LABEL[l.type] || l.type}
                </span>
                <span className="text-[11px] text-white/40">
                  {formatDateTime(new Date(l.createdAt).toISOString())}
                </span>
              </div>
              {l.message && <p className="mt-2 text-sm font-semibold">{l.message}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                {l.name && <span>👤 {l.name}</span>}
                <a href={`tel:+${l.phone}`} className="inline-flex items-center gap-1 font-bold text-brand-yellow hover:underline">
                  <Phone className="h-3 w-3" /> +{l.phone}
                </a>
                {l.meta &&
                  Object.entries(l.meta).map(([k, v]) => (
                    <span key={k} className="text-white/45">
                      {k}: {v}
                    </span>
                  ))}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
