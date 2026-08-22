'use client';

import { useEffect, useMemo, useState } from 'react';
import { Inbox, Phone, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

type LeadStatus = 'new' | 'progress' | 'done';

interface Lead {
  id: string;
  type: string;
  name?: string;
  phone: string;
  message?: string;
  meta?: Record<string, string>;
  status?: LeadStatus;
  createdAt: number;
}

const TYPE_LABEL: Record<string, string> = {
  product: '🔎 Maxsus so‘rov',
  branch: '🏢 Filial',
  service: '🔧 Servis',
  franchise: '⭐️ Franshiza',
};

const STATUS: { key: LeadStatus; label: string; dot: string; chip: string }[] = [
  { key: 'new', label: 'Yangi', dot: 'bg-danger', chip: 'bg-danger/15 text-danger' },
  { key: 'progress', label: 'Jarayonda', dot: 'bg-brand-yellow', chip: 'bg-brand-yellow/15 text-brand-yellow' },
  { key: 'done', label: 'Ko‘rib chiqilgan', dot: 'bg-success', chip: 'bg-success/15 text-success' },
];
const statusMeta = (s?: LeadStatus) => STATUS.find((x) => x.key === (s || 'new'))!;

type Tab = 'all' | LeadStatus;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lead', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLeads(d?.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, progress: 0, done: 0 };
    for (const l of leads) c[l.status || 'new'] += 1;
    return c;
  }, [leads]);

  const filtered = useMemo(
    () => (tab === 'all' ? leads : leads.filter((l) => (l.status || 'new') === tab)),
    [leads, tab],
  );

  const setStatus = async (id: string, status: LeadStatus) => {
    // Optimistic — snap the chip immediately, roll back on failure.
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    setBusy(id);
    try {
      const res = await fetch('/api/lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) setLeads(prev);
    } catch {
      setLeads(prev);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
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

      {/* status filter tabs */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {([
          ['all', 'Barchasi', counts.all],
          ['new', 'Yangi', counts.new],
          ['progress', 'Jarayonda', counts.progress],
          ['done', 'Ko‘rib chiqilgan', counts.done],
        ] as [Tab, string, number][]).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 font-semibold transition-colors',
              tab === key ? 'bg-brand-yellow/15 text-brand-yellow' : 'text-white/55 hover:bg-white/5',
            )}
          >
            {label}
            {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Yuklanmoqda...
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-8 text-center text-sm text-white/45">
            {tab === 'all' ? 'Hali so‘rov yo‘q.' : 'Bu holatda so‘rov yo‘q.'}
          </p>
        ) : (
          filtered.map((l) => {
            const meta = statusMeta(l.status);
            return (
              <div key={l.id} className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-yellow/15 px-2 py-0.5 text-[11px] font-bold text-brand-yellow">
                      {TYPE_LABEL[l.type] || l.type}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold', meta.chip)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>
                  </div>
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

                {/* status switcher */}
                <div className="mt-3 flex items-center gap-1.5 border-t border-brand-surface-border/60 pt-3">
                  {busy === l.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
                  {STATUS.map((s) => {
                    const active = (l.status || 'new') === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => !active && setStatus(l.id, s.key)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all',
                          active ? s.chip : 'text-white/45 hover:bg-white/5',
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
