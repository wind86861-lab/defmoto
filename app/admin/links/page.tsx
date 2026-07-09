'use client';

import { useEffect, useState } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  Check,
  MousePointerClick,
  Users,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHaptic } from '@/hooks/useHaptic';

interface CampaignLink {
  id: string;
  code: string;
  label: string;
  target: string;
  clicks: number;
  uniques: number;
  createdAt: number;
  lastClickAt?: number;
}

const PRESETS = [
  { label: 'Bosh sahifa', target: '/' },
  { label: 'Katalog', target: '/catalog' },
  { label: 'Aksiyalar', target: '/search' },
];

export default function AdminLinksPage() {
  const { notify, impact } = useHaptic();
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('/');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkUrl = (code: string) => `${origin}/r/${code}`;

  const load = async () => {
    try {
      const r = await fetch('/api/admin/links', { cache: 'no-store' });
      const j = await r.json();
      setLinks(j?.links || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const r = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), target: target.trim() || '/' }),
      });
      if (r.ok) {
        notify('success');
        setLabel('');
        setTarget('/');
        await load();
      }
    } catch {
      /* ignore */
    }
    setCreating(false);
  };

  const remove = async (id: string) => {
    impact('medium');
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
    } catch {
      /* ignore */
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl(code));
      setCopied(code);
      notify('success');
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
          <Link2 className="h-6 w-6 text-brand-yellow" />
          Marketing havolalar
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Rassilka uchun kuzatiladigan havola yarating — nechta odam kirganini koʻrib turasiz.
        </p>
      </header>

      {/* Create */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">Yangi havola</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Nomi (kampaniya)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Masalan: Instagram oktabr" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Qayerga olib boradi</label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Sahifa havolasini qoʻying yoki /product/..." />
            <p className="mt-1 text-[11px] text-white/40">Toʻliq havola (brauzerdan nusxa) yoki sayt yoʻli (/) — ikkalasi ham boʻladi.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-white/40">Tez tanlash:</span>
          {PRESETS.map((p) => (
            <button
              key={p.target}
              type="button"
              onClick={() => setTarget(p.target)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors',
                target === p.target
                  ? 'border-brand-yellow/50 bg-brand-yellow/10 text-brand-yellow'
                  : 'border-brand-surface-border bg-brand-dark/40 text-white/65 hover:text-brand-yellow',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button glow onClick={create} loading={creating} disabled={!label.trim()} leftIcon={<Plus className="h-4 w-4" />}>
          Havola yaratish
        </Button>
      </section>

      {/* Summary */}
      {links.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/15 text-brand-yellow">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold">{totalClicks.toLocaleString('ru-RU')}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">Jami bosishlar · {links.length} havola</p>
          </div>
        </div>
      )}

      {/* List */}
      <section className="space-y-3">
        {loading ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Yuklanmoqda...
          </p>
        ) : links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Hali havola yoʻq. Yuqoridan yarating.
          </p>
        ) : (
          links.map((l) => (
            <div key={l.id} className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold">{l.label}</p>
                  <a
                    href={l.target}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-white/50 hover:text-brand-yellow"
                  >
                    {l.target} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  aria-label="Oʻchirish"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-danger/15 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Shareable link */}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-dark/40 px-3 py-2">
                <span className="truncate font-mono text-xs text-white/75">{linkUrl(l.code)}</span>
                <button
                  type="button"
                  onClick={() => copy(l.code)}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-yellow/15 px-2.5 py-1.5 text-[11px] font-bold text-brand-yellow hover:bg-brand-yellow hover:text-brand-dark"
                >
                  {copied === l.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === l.code ? 'Nusxa olindi' : 'Nusxa olish'}
                </button>
              </div>

              {/* Stats */}
              <div className="mt-3 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-brand-dark/40 px-3 py-2">
                  <MousePointerClick className="h-4 w-4 text-brand-yellow" />
                  <div>
                    <p className="font-display text-lg font-extrabold leading-none">{l.clicks.toLocaleString('ru-RU')}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Bosishlar</p>
                  </div>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-brand-dark/40 px-3 py-2">
                  <Users className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-display text-lg font-extrabold leading-none">{l.uniques.toLocaleString('ru-RU')}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Alohida odam</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
