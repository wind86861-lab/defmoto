'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft,
  User,
  Phone,
  Settings,
  FileText,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { uploadAttachment } from '@/lib/uploadImage';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

type Status = 'new' | 'open' | 'closed';

interface OperatorState {
  configured: boolean;
  operatorConnected: boolean;
  operator: { name: string; phone: string } | null;
}

interface RelayMsg {
  id: string;
  author: 'operator' | 'customer';
  text: string;
  image?: string;
  video?: string;
  file?: { url: string; name: string; size?: number };
  createdAt: string;
}

interface RelaySession {
  id: string;
  customerName?: string;
  lastText: string;
  lastActivity: number;
  messageCount: number;
  customerCount: number;
  status: Status;
  unread: number;
  messages: RelayMsg[];
}

type Tab = 'all' | Status;

function timeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ACCEPT =
  'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar';

export default function AdminChatsPage() {
  const t = useTranslations('admin');
  const { notify, impact } = useHaptic();
  const toast = useToast();

  const [relay, setRelay] = useState<OperatorState | null>(null);
  const [sessions, setSessions] = useState<RelaySession[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // operator settings form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshSessions = () =>
    fetch('/api/chat/sessions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { sessions: RelaySession[] }) => setSessions(d.sessions || []))
      .catch(() => {});

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch('/api/chat/operator', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d: OperatorState) => {
          if (!active) return;
          setRelay(d);
          if (!dirty && d.operator) {
            setName(d.operator.name);
            setPhone(d.operator.phone);
          }
        })
        .catch(() => {});
      fetch('/api/chat/sessions', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d: { sessions: RelaySession[] }) => active && setSessions(d.sessions || []))
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [dirty]);

  const open = useMemo(
    () => sessions.find((s) => s.id === openId) || null,
    [sessions, openId],
  );

  // Auto-scroll the thread to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open?.messages.length, openId]);

  const counts = useMemo(() => {
    const c = { all: sessions.length, new: 0, open: 0, closed: 0 };
    for (const s of sessions) c[s.status] += 1;
    return c;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (tab !== 'all' && s.status !== tab) return false;
      if (!q) return true;
      return (
        (s.customerName || '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.lastText || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, tab, query]);

  const openThread = (id: string) => {
    setOpenId(id);
    setReply('');
    impact('light');
    // Clear the unread badge for this chat.
    const s = sessions.find((x) => x.id === id);
    if (s && s.unread > 0) {
      fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      })
        .then(() => refreshSessions())
        .catch(() => {});
    }
  };

  const send = async (
    text: string,
    attachment?: { url: string; kind: 'image' | 'video' | 'file'; name?: string; size?: number },
  ) => {
    if (!openId || (!text.trim() && !attachment)) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: openId, text: text.trim(), attachment }),
      });
      const d = await res.json();
      if (d.ok) {
        notify('success');
        setReply('');
        await refreshSessions();
        if (!d.delivered) toast.info(t('opSavedToast'), t('inboxOfflineNote'));
      }
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !openId) return;
    setUploading(true);
    try {
      const att = await uploadAttachment(file);
      await send(reply, att);
    } catch {
      toast.error(t('inboxUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const finishChat = async () => {
    if (!openId) return;
    await fetch('/api/chat/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: openId }),
    }).catch(() => {});
    notify('success');
    await refreshSessions();
  };

  const saveOperator = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/chat/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const d = await res.json();
      if (d.ok) {
        notify('success');
        toast.success(t('opSavedToast'));
        setDirty(false);
        setRelay((r) => (r ? { ...r, operator: d.operator, operatorConnected: false } : r));
      }
    } finally {
      setSaving(false);
    }
  };

  const canSave = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9;

  const statusDot = (s: Status) =>
    s === 'new' ? 'bg-danger' : s === 'open' ? 'bg-brand-yellow' : 'bg-success';

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold">{t('navChats')}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/55">
            <span className={cn('h-1.5 w-1.5 rounded-full', relay?.operatorConnected ? 'bg-success' : 'bg-brand-yellow')} />
            {relay?.operatorConnected ? t('opStatusConnected') : relay?.operator ? t('opStatusPending') : t('opStatusNone')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
            settingsOpen
              ? 'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow'
              : 'border-brand-surface-border bg-brand-surface text-white/75 hover:text-brand-yellow',
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{t('inboxSettings')}</span>
        </button>
      </header>

      {settingsOpen && (
        <article className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">{t('opNameLabel')}</span>
              <Input leftIcon={<User className="h-3.5 w-3.5" />} placeholder={t('opNamePlaceholder')} value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">{t('opPhoneLabel')}</span>
              <Input type="tel" leftIcon={<Phone className="h-3.5 w-3.5" />} placeholder={t('opPhonePlaceholder')} value={phone} onChange={(e) => { setPhone(e.target.value); setDirty(true); }} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" glow leftIcon={<Check className="h-4 w-4" />} onClick={saveOperator} disabled={!canSave || saving}>
              {t('opSaveBtn')}
            </Button>
            {relay?.configured && BOT_USERNAME && relay.operator && !relay.operatorConnected && (
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow">
                <Send className="h-4 w-4" />
                {t('tgRelayConnectBtn')}
              </a>
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">{t('opHowto')}</p>
        </article>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface">
        {/* LEFT — chat list */}
        <aside className={cn('flex w-full flex-col border-brand-surface-border sm:w-80 sm:border-r lg:w-96', openId && 'hidden sm:flex')}>
          <div className="border-b border-brand-surface-border p-3">
            <Input leftIcon={<Search className="h-4 w-4" />} placeholder={t('inboxSearch')} value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="mt-3 flex gap-1 overflow-x-auto text-xs">
              {([
                ['all', t('inboxTabAll'), counts.all],
                ['new', t('inboxTabNew'), counts.new],
                ['open', t('inboxTabOpen'), counts.open],
                ['closed', t('inboxTabClosed'), counts.closed],
              ] as [Tab, string, number][]).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'shrink-0 rounded-lg px-2.5 py-1.5 font-semibold transition-colors',
                    tab === key ? 'bg-brand-yellow/15 text-brand-yellow' : 'text-white/55 hover:bg-white/5',
                  )}
                >
                  {label}
                  {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="mb-3 h-8 w-8 text-white/25" strokeWidth={1.5} />
                <p className="text-sm text-white/45">{t('inboxEmpty')}</p>
              </div>
            ) : (
              <ul>
                {filtered.map((s) => {
                  const last = s.messages[s.messages.length - 1];
                  const isTg = s.id.startsWith('tg:');
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => openThread(s.id)}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-brand-surface-border/60 p-3 text-left transition-colors hover:bg-white/3',
                          openId === s.id && 'bg-white/5',
                        )}
                      >
                        <div className="relative shrink-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-yellow font-display text-sm font-extrabold text-brand-dark">
                            {(s.customerName || 'M').slice(0, 1).toUpperCase()}
                          </div>
                          <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-surface', statusDot(s.status))} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold">
                              {s.customerName || t('customerLabel')}
                              {isTg && <span className="ml-1 align-middle text-[10px] text-info">TG</span>}
                            </span>
                            <span className="shrink-0 text-[10px] text-white/40">{last ? timeShort(last.createdAt) : ''}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-white/50">
                              {last?.author === 'operator' ? 'Siz: ' : ''}
                              {s.lastText || t('attachmentFallback')}
                            </span>
                            {s.unread > 0 && (
                              <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-yellow px-1.5 text-[10px] font-bold text-brand-dark">
                                {s.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* RIGHT — conversation */}
        <section className={cn('flex min-w-0 flex-1 flex-col', !openId && 'hidden sm:flex')}>
          {!open ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-white/20" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-white/60">{t('inboxSelectTitle')}</p>
              <p className="mt-1 max-w-xs text-xs text-white/40">{t('inboxSelectDesc')}</p>
            </div>
          ) : (
            <>
              {/* thread header */}
              <div className="flex items-center gap-3 border-b border-brand-surface-border p-3">
                <button type="button" onClick={() => setOpenId(null)} className="shrink-0 rounded-lg p-1 text-white/60 hover:bg-white/5 sm:hidden" aria-label={t('inboxBackAria')}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-sm font-extrabold text-brand-dark">
                  {(open.customerName || 'M').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{open.customerName || t('customerLabel')}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(open.status))} />
                    {open.status === 'new' ? t('inboxTabNew') : open.status === 'open' ? t('inboxTabOpen') : t('inboxFinished')}
                  </p>
                </div>
                {open.status !== 'closed' ? (
                  <Button size="sm" variant="ghost" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={finishChat}>
                    {t('inboxFinish')}
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                    <CheckCheck className="h-3.5 w-3.5" />
                    {t('inboxFinished')}
                  </span>
                )}
              </div>

              {/* messages */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-brand-dark/30 p-4">
                {open.messages.map((m) => {
                  const mine = m.author === 'operator';
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3 py-2 text-sm',
                          mine
                            ? 'rounded-br-sm bg-brand-yellow/90 text-brand-dark'
                            : 'rounded-bl-sm bg-brand-surface-elevated text-white',
                        )}
                      >
                        {m.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a href={m.image} target="_blank" rel="noreferrer"><img src={m.image} alt="" className="mb-1 max-h-52 rounded-lg object-cover" /></a>
                        )}
                        {m.video && <video src={m.video} controls playsInline className="mb-1 max-h-52 rounded-lg" />}
                        {m.file && (
                          <a href={m.file.url} target="_blank" rel="noreferrer" className={cn('mb-1 flex items-center gap-2 rounded-lg p-2', mine ? 'bg-brand-dark/10' : 'bg-white/5')}>
                            <FileText className="h-5 w-5 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold">{m.file.name}</span>
                              {m.file.size ? <span className="block text-[10px] opacity-60">{fmtSize(m.file.size)}</span> : null}
                            </span>
                          </a>
                        )}
                        {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                        <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-brand-dark/50' : 'text-white/35')}>{timeShort(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* composer */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(reply); }}
                className="flex items-center gap-2 border-t border-brand-surface-border p-3"
              >
                <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={onPickFile} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || sending}
                  aria-label={t('inboxAttach')}
                  className="shrink-0 rounded-xl border border-brand-surface-border p-2.5 text-white/60 transition-colors hover:text-brand-yellow disabled:opacity-40"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </button>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('inboxComposer')}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-brand-surface-border bg-brand-dark/40 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-yellow/40"
                />
                <button
                  type="submit"
                  disabled={sending || (!reply.trim() && !uploading)}
                  aria-label={t('opReplySend')}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-yellow text-brand-dark shadow-glow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
