'use client';

import { useEffect, useState } from 'react';
import { Headset, Phone, Send, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

interface Operator {
  id: string;
  name: string;
  phone: string;
  telegramId: string | null;
  createdAt: number;
  active: boolean;
}

interface OperatorsResponse {
  configured: boolean;
  operatorConnected: boolean;
  operators: Operator[];
}

export default function AdminOperatorsPage() {
  const [data, setData] = useState<OperatorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/operators', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (op: Operator) => {
    if (!confirm(`"${op.name}" ni operatorlikdan olasizmi? U yana oddiy mijoz boʻladi.`)) return;
    setBusyId(op.id);
    try {
      const res = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: op.id, makeOperator: false }),
      });
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const operators = data?.operators ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
          <Headset className="h-6 w-6 text-brand-yellow" />
          Operatorlar
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Chat operatorlarini boshqarish. Mijozni operator qilish uchun <b>Klientlar</b> boʻlimidan
          foydalaning — belgilangan foydalanuvchi shu yerga oʻtadi.
        </p>
      </header>

      {/* Relay status */}
      <div className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <StatusDot
            ok={!!data?.configured}
            okText="Telegram bot ulangan"
            offText="Bot sozlanmagan (TELEGRAM_BOT_TOKEN)"
          />
          <StatusDot
            ok={!!data?.operatorConnected}
            okText="Operator botga ulangan"
            offText="Operator hali botga /start bosmagan"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/50">
          Faol operator botga <code className="rounded bg-brand-dark/60 px-1">/start</code> bosib ulanadi.
          Soʻng mijoz savollari operatorning Telegramiga keladi — u matn, rasm yoki video bilan javob bersa,
          mijozning chatiga yetkaziladi.
        </p>
      </div>

      {/* Operators list */}
      <div className="space-y-2.5">
        {loading ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Yuklanmoqda...
          </p>
        ) : operators.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-8 text-center text-sm text-white/45">
            Hali operator yoʻq. <b>Klientlar</b> boʻlimidan mijozni tanlab, «Operator qilish» tugmasini bosing.
          </p>
        ) : (
          operators.map((op) => (
            <div
              key={op.id}
              className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-base font-extrabold text-brand-dark">
                {(op.name || 'O').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-bold">
                  {op.name || 'Operator'}
                  {op.active && (
                    <span className="shrink-0 rounded-md bg-success/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-success">
                      Faol
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex items-center gap-3 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> +{op.phone}
                  </span>
                  {op.telegramId && (
                    <span className="inline-flex items-center gap-1 text-[#229ED9]">
                      <Send className="h-3 w-3" /> TG
                    </span>
                  )}
                  <span className="text-white/35">
                    {formatDateTime(new Date(op.createdAt).toISOString())}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(op)}
                disabled={busyId === op.id}
                aria-label="Operatorlikdan olish"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-surface-border bg-brand-dark/40 text-white/55 transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50 touch-feedback"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusDot({ ok, okText, offText }: { ok: boolean; okText: string; offText: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <Circle className="h-4 w-4 text-white/30" />
      )}
      <span className={ok ? 'text-white/80' : 'text-white/45'}>{ok ? okText : offText}</span>
    </span>
  );
}
