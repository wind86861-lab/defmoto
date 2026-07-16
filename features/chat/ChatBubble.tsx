'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ChatAttachmentView } from './ChatAttachments';
import type { ChatMessage } from '@/types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

function timeLabel(iso: string) {
  // Tashkent time (UTC+5, fixed) — deterministic across server/browser.
  const d = new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const URL_RE = /(https?:\/\/[^\s]+)/gi;

// Render message text with clickable links (operators often paste product URLs).
function renderText(text: string, isUser: boolean) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('underline underline-offset-2', isUser ? 'text-brand-dark' : 'text-brand-yellow')}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ChatBubble({ message, showAvatar }: ChatBubbleProps) {
  const isUser = message.author === 'user';
  const isSystem = message.author === 'system';

  if (isSystem) {
    return (
      <div className="my-2 text-center">
        <span className="inline-block rounded-full bg-brand-surface px-3 py-1 text-[11px] text-white/55">
          {message.text}
        </span>
      </div>
    );
  }

  const hasOnlyAttachments = !message.text && message.attachments?.length;

  return (
    <div
      className={cn(
        'flex gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Operator avatar */}
      {!isUser && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full font-display text-xs font-extrabold text-brand-dark',
            showAvatar
              ? 'bg-gradient-yellow shadow-glow-sm'
              : 'invisible',
          )}
        >
          {message.operatorName?.[0] ?? 'O'}
        </div>
      )}

      <div
        className={cn(
          'flex max-w-[78%] flex-col gap-2 sm:max-w-[65%]',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {/* Text bubble */}
        {message.text && (
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm',
              isUser
                ? 'rounded-br-sm bg-gradient-yellow text-brand-dark'
                : 'rounded-bl-sm border border-brand-surface-border bg-brand-surface text-white',
            )}
          >
            <span className="whitespace-pre-wrap break-words">{renderText(message.text, isUser)}</span>
          </div>
        )}

        {/* Attachments */}
        {message.attachments?.map((att, i) => (
          <div
            key={i}
            className={cn(
              'w-[260px] sm:w-[300px]',
              isUser ? 'self-end' : 'self-start',
            )}
          >
            <ChatAttachmentView attachment={att} />
          </div>
        ))}

        {/* Meta line */}
        <div
          className={cn(
            'flex items-center gap-1 px-1 text-[10px] text-white/45',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span>{timeLabel(message.createdAt)}</span>
          {isUser && message.status && (
            <span className="text-white/55">
              {message.status === 'sent' && <Check className="h-3 w-3" />}
              {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
              {message.status === 'read' && (
                <CheckCheck className="h-3 w-3 text-brand-yellow" />
              )}
              {message.status === 'sending' && (
                <span className="text-[10px]">...</span>
              )}
            </span>
          )}
        </div>
        {/* Suppress unused var warning for hasOnlyAttachments without removing useful intent */}
        <span className="hidden">{hasOnlyAttachments ? '' : ''}</span>
      </div>
    </div>
  );
}

export function TypingIndicator({ operatorName }: { operatorName: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full bg-gradient-yellow font-display text-xs font-extrabold text-brand-dark shadow-glow-sm">
        {operatorName[0]}
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-brand-surface-border bg-brand-surface px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow [animation-delay:300ms]" />
      </div>
    </div>
  );
}
