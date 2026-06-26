'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MessageCircle, ExternalLink, Circle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/lib/stores/chat';
import { useMounted } from '@/hooks/useMounted';
import { formatDateTime } from '@/lib/format';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

export default function AdminChatsPage() {
  const t = useTranslations('admin');
  const tChat = useTranslations('chat');
  const mounted = useMounted();
  const messages = useChatStore((s) => s.messages);
  const operator = useChatStore((s) => s.operator);

  const [relay, setRelay] = useState<
    { configured: boolean; operatorConnected: boolean } | null
  >(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/chat/status', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => active && setRelay(d))
        .catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, []);

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

      {/* Telegram live-relay status */}
      <article
        className={`rounded-2xl border p-5 ${
          relay?.operatorConnected
            ? 'border-success/40 bg-success/5'
            : 'border-brand-yellow/30 bg-brand-yellow/5'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                {t('tgRelayTitle')}
              </h3>
              <p className="mt-0.5 text-xs text-white/60">
                {!relay
                  ? t('tgRelayChecking')
                  : !relay.configured
                    ? t('tgRelayDisabled')
                    : relay.operatorConnected
                      ? t('tgRelayConnected')
                      : t('tgRelayOffline')}
              </p>
            </div>
          </div>
          {relay?.configured && BOT_USERNAME && (
            <a
              href={`https://t.me/${BOT_USERNAME}?start=operator`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-4 py-2 text-sm font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
            >
              <Send className="h-4 w-4" />
              {t('tgRelayConnectBtn')}
            </a>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          {t('tgRelayHowto')}
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
