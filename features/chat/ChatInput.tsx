'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useHaptic } from '@/hooks/useHaptic';

interface ChatInputProps {
  onSend: (input: { text?: string; images?: string[] }) => void;
  disabled?: boolean;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
  onHeightChange?: (height: number) => void;
}

export function ChatInput({
  onSend,
  disabled,
  suggestions,
  onSuggestion,
  onHeightChange,
}: ChatInputProps) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { impact } = useHaptic();

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [text]);

  // Report rendered height so the parent can pad the scrollable message list
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onHeightChange) return;
    const observer = new ResizeObserver(([entry]) => {
      onHeightChange(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const handlePickFiles = () => {
    impact('light');
    fileInputRef.current?.click();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((dataUrls) =>
      setImages((prev) => [...prev, ...dataUrls].slice(0, 6)),
    );
    e.target.value = '';
  };

  const canSend = (text.trim().length > 0 || images.length > 0) && !disabled;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    impact('medium');
    onSend({
      text: text.trim() || undefined,
      images: images.length ? images : undefined,
    });
    setText('');
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-surface-border bg-brand-dark/95 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-3xl">
        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-brand-surface-border/50 px-3 py-2.5 scrollbar-hide">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion?.(s)}
                className="shrink-0 rounded-full border border-brand-yellow/30 bg-brand-yellow/8 px-3 py-1 text-xs font-semibold text-brand-yellow transition-colors hover:bg-brand-yellow/15"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-brand-surface-border bg-brand-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label={t('removeImageAria')}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark/85 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <form
          onSubmit={handleSubmit}
          className="safe-bottom flex items-end gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          <button
            type="button"
            onClick={handlePickFiles}
            aria-label={t('uploadImageAria')}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-surface-border bg-brand-surface text-white/70 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-50 touch-feedback"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <div
            className={cn(
              'flex flex-1 items-end rounded-2xl border border-brand-surface-border bg-brand-surface transition-colors',
              'focus-within:border-brand-yellow/60 focus-within:shadow-glow-sm',
            )}
          >
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={t('messagePlaceholder')}
              rows={1}
              className="flex-1 resize-none bg-transparent px-3.5 py-2.5 text-base text-white outline-none placeholder:text-white/35"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            aria-label={t('sendAria')}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all touch-feedback',
              canSend
                ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110'
                : 'cursor-not-allowed bg-brand-surface text-white/30',
            )}
          >
            <Send className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>

      {/* Image only hint */}
      <div className="hidden">
        <ImageIcon />
      </div>
    </div>
  );
}
