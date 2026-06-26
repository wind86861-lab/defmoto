'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  MessageCircle,
  ExternalLink,
  Circle,
  Send,
  User,
  Phone,
  Check,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useChatStore } from '@/lib/stores/chat';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { formatDateTime } from '@/lib/format';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

interface OperatorState {
  configured: boolean;
  operatorConnected: boolean;
  operator: { name: string; phone: string } | null;
}

export default function AdminChatsPage() {
  const t = useTranslations('admin');
  const tChat = useTranslations('chat');
  const mounted = useMounted();
  const { notify } = useHaptic();
  const toast = useToast();
  const messages = useChatStore((s) => s.messages);
  const operator = useChatStore((s) => s.operator);

  const [relay, setRelay] = useState<OperatorState | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () =>
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
    load();
    const iv = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [dirty]);

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

  const clearOperator = async () => {
    setSaving(true);
    try {
      await fetch('/api/chat/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      });
      notify('warning');
      toast.info(t('opClearedToast'));
      setName('');
      setPhone('');
      setDirty(false);
      setRelay((r) => (r ? { ...r, operator: null, operatorConnected: false } : r));
    } finally {
      setSaving(false);
    }
  };

  const canSave = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9;
  const statusText = !relay
    ? t('tgRelayChecking')
    : !relay.configured
      ? t('tgRelayDisabled')
      : relay.operatorConnected
        ? t('opStatusConnected')
        : relay.operator
          ? t('opStatusPending')
          : t('opStatusNone');

  const messageCount = mounted ? messages.length : 0;
  const lastMessage = mounted ? messages[messages.length - 1] : null;
  const userMessages = mounted ? messages.filter((m) => m.author === 'user').length : 0;
  const lastMessageText =
    lastMessage?.id === 'welcome'
      ? tChat('welcomeMessageText')
      : lastMessage?.text ?? t('attachmentFallback');

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
          {t('navChats')}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          {t('chatsSubtitle')}
        </p>
      </header>

      {/* Telegram operator account management */}
      <article
        className={`rounded-2xl border p-5 ${
          relay?.operatorConnected
            ? 'border-success/40 bg-success/5'
            : 'border-brand-yellow/30 bg-brand-yellow/5'
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                relay?.operatorConnected
                  ? 'bg-success/15 text-success'
                  : 'bg-brand-yellow/15 text-brand-yellow'
              }`}
            >
              <Send className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold">
                {t('opSectionTitle')}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    relay?.operatorConnected ? 'bg-success' : 'bg-brand-yellow'
                  }`}
                />
                <span className="text-white/60">{statusText}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">
              {t('opNameLabel')}
            </span>
            <Input
              leftIcon={<User className="h-3.5 w-3.5" />}
              placeholder={t('opNamePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55">
              {t('opPhoneLabel')}
            </span>
            <Input
              type="tel"
              leftIcon={<Phone className="h-3.5 w-3.5" />}
              placeholder={t('opPhonePlaceholder')}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setDirty(true);
              }}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="md"
            glow
            leftIcon={<Check className="h-4 w-4" />}
            onClick={saveOperator}
            disabled={!canSave || saving}
          >
            {t('opSaveBtn')}
          </Button>
          {relay?.operator && (
            <Button
              size="md"
              variant="ghost"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={clearOperator}
              disabled={saving}
            >
              {t('opClearBtn')}
            </Button>
          )}
          {relay?.configured && BOT_USERNAME && relay.operator && !relay.operatorConnected && (
            <a
              href={`https://t.me/${BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow"
            >
              <Send className="h-4 w-4" />
              {t('tgRelayConnectBtn')}
            </a>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          {t('opHowto')}
        </p>
      </article>

      {/* Single active chat (demo) */}
      <article className="rounded-2xl border border-brand-yellow/30 bg-brand-surface p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-base font-extrabold text-brand-dark shadow-glow-sm">
            U
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-surface bg-success" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold">{t('customerLabel')}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                <Circle className="h-2 w-2 fill-success text-success" />
                {t('onlineBadge')}
              </span>
              <span className="text-[11px] text-white/45">
                {t('messageCountText', { count: messageCount })}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-white/55">
              {t('operatorLabel')} <span className="font-bold text-brand-yellow">{operator.name}</span> · {tChat('operatorRoleLabel')}
            </p>

            {lastMessage && (
              <div className="mt-3 rounded-lg border border-brand-surface-border bg-brand-dark/40 p-3">
                <p className="line-clamp-2 text-sm text-white/75">
                  {lastMessageText}
                </p>
                <p className="mt-1 text-[10px] text-white/45">
                  {formatDateTime(lastMessage.createdAt)} · {lastMessage.author}
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Link href="/chat" target="_blank">
              <Button size="sm" variant="secondary" leftIcon={<ExternalLink className="h-3 w-3" />}>
                {t('goToChatButton')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-surface-border pt-4">
          <Stat label={t('statTotalMessages')} value={messageCount} />
          <Stat label={t('statCustomerMessages')} value={userMessages} />
          <Stat label={t('statResponseTime')} value="~5m" />
        </div>
      </article>

      <div className="rounded-2xl border border-dashed border-brand-surface-border bg-brand-surface/50 p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-white/30" />
        <h3 className="font-display text-base font-bold">{t('noOtherChatsTitle')}</h3>
        <p className="mt-1 text-sm text-white/55">
          {t('noOtherChatsDesc')}
        </p>
        <p className="mt-3 text-[11px] text-white/35">
          {t('backendNoteText')}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-brand-dark/40 p-2 text-center">
      <div className="font-display text-lg font-extrabold text-brand-yellow">
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
        {label}
      </div>
    </div>
  );
}
