'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useChatStore } from '@/lib/stores/chat';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { ChatBubble, TypingIndicator } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { generateOperatorReply } from './operatorBot';
import type { ChatMessage } from '@/types/chat';

function id() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatClient() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();
  const mounted = useMounted();
  const sessionId = useChatStore((s) => s.sessionId);
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isOperatorTyping);
  const operator = useChatStore((s) => s.operator);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setOperatorTyping = useChatStore((s) => s.setOperatorTyping);
  const reset = useChatStore((s) => s.reset);
  const { impact, notify } = useHaptic();
  const { user } = useTelegram();

  const listRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(0);
  // Only pull operator replies newer than what we've already shown.
  const sinceRef = useRef<number>(Date.now());

  const suggestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
    t('suggestion5'),
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!mounted) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, isTyping, mounted]);

  // Keep the seeded welcome message in sync with the active locale
  useEffect(() => {
    if (!mounted) return;
    if (messages[0]?.id === 'welcome') {
      updateMessage('welcome', {
        text: t('welcomeMessageText'),
        operatorRole: t('operatorRoleLabel'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, locale]);

  // Poll the relay for live operator replies (no-op when relay is disabled).
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/chat/poll?sessionId=${encodeURIComponent(sessionId)}&since=${sinceRef.current}`,
          { cache: 'no-store' },
        );
        const data = await res.json();
        if (!cancelled && data?.ok && Array.isArray(data.messages) && data.messages.length) {
          for (const m of data.messages) {
            const ts = new Date(m.createdAt).getTime();
            if (ts > sinceRef.current) sinceRef.current = ts;
            addMessage({
              id: m.id,
              author: 'operator',
              text: m.text,
              attachments: m.image ? [{ kind: 'image' as const, url: m.image }] : undefined,
              createdAt: m.createdAt,
              operatorName: operator.name,
              operatorRole: t('operatorRoleLabel'),
            });
          }
          setOperatorTyping(false);
        }
      } catch {
        /* offline / relay down — ignore, try again */
      }
      if (!cancelled) timer = setTimeout(poll, 3000);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, sessionId]);

  // Hydration-safe message list
  const messagesToRender = mounted ? messages : [];

  const handleSend = async ({ text, images }: { text?: string; images?: string[] }) => {
    notify('success');

    const userMsg: ChatMessage = {
      id: id(),
      author: 'user',
      text,
      attachments: images?.map((url) => ({ kind: 'image' as const, url })),
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    addMessage(userMsg);

    setTimeout(() => updateMessage(userMsg.id, { status: 'sent' }), 350);
    setTimeout(() => updateMessage(userMsg.id, { status: 'delivered' }), 700);

    // Try to relay to a live Telegram operator first.
    let relayed = false;
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text: text || (images?.length ? '📷 (rasm yuborildi)' : ''),
          customerName: user?.first_name,
        }),
      });
      const data = await res.json();
      relayed = Boolean(data?.relayed);
    } catch {
      relayed = false;
    }

    updateMessage(userMsg.id, { status: 'read' });

    // Live operator will answer via the poll loop — no fake reply needed.
    if (relayed) return;

    // Fallback: local auto-reply bot (relay off / no operator connected).
    setOperatorTyping(true);
    setTimeout(
      () => {
        const replies = generateOperatorReply(
          { text, hasImage: Boolean(images?.length) },
          t,
        );
        setOperatorTyping(false);
        replies.forEach((reply, idx) => {
          setTimeout(() => addMessage(reply), idx * 350);
        });
      },
      1200 + (text?.length ?? 0) * 12,
    );
  };

  const handleReset = () => {
    impact('medium');
    reset();
  };

  // Group consecutive messages from same author for avatar logic
  const withAvatarFlag = useMemo(() => {
    return messagesToRender.map((m, i, arr) => {
      const next = arr[i + 1];
      const showAvatar = !next || next.author !== m.author;
      return { msg: m, showAvatar };
    });
  }, [messagesToRender]);

  return (
    <div className="flex h-[var(--tg-viewport-height,100vh)] flex-col bg-brand-dark">
      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 border-b border-brand-surface-border bg-brand-dark/95 px-3 py-2.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t('backAria')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-white/8 touch-feedback md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link
          href="/"
          aria-label={t('homeAria')}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-white/8 md:flex"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Operator info */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-base font-extrabold text-brand-dark shadow-glow-sm">
          {operator.avatarInitial}
          {operator.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-dark bg-success" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold leading-tight">
            {operator.name} ·{' '}
            <span className="text-white/65">{t('operatorRoleLabel')}</span>
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                operator.isOnline ? 'bg-success' : 'bg-white/40',
              )}
            />
            <span className="text-white/55">
              {operator.isOnline ? t('onlineStatus') : t('offlineStatus')} · {t('responseTimeText')}
            </span>
          </p>
        </div>

        <a
          href="tel:+998998107090"
          aria-label={t('callAria')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-surface-border bg-brand-surface text-success transition-colors hover:border-success/40"
        >
          <Phone className="h-4 w-4" fill="currentColor" />
        </a>
        <button
          type="button"
          onClick={handleReset}
          aria-label={t('clearAria')}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition-colors hover:bg-white/8 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {/* Messages list */}
      <div
        ref={listRef}
        className="relative flex-1 overflow-y-auto"
        style={{ paddingBottom: inputHeight }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 py-4 sm:px-4">
          {/* Info pill */}
          <div className="mb-3 mx-auto rounded-full border border-brand-yellow/20 bg-brand-yellow/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
            {t('infoPillText')}
          </div>

          {withAvatarFlag.map(({ msg, showAvatar }) => (
            <ChatBubble key={msg.id} message={msg} showAvatar={showAvatar} />
          ))}

          {isTyping && <TypingIndicator operatorName={operator.name} />}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isTyping}
        suggestions={messages.length <= 1 ? suggestions : undefined}
        onSuggestion={(s) => handleSend({ text: s })}
        onHeightChange={setInputHeight}
      />
    </div>
  );
}
