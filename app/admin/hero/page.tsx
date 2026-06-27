'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink,
  Check,
  ImageOff,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSiteSettings, type HeroSlide } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';

export default function AdminHeroPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const { notify, impact } = useHaptic();
  const hero = useSiteSettings((s) => s.hero);
  const setHero = useSiteSettings((s) => s.setHero);
  const resetHero = useSiteSettings((s) => s.resetHero);
  const addSlide = useSiteSettings((s) => s.addSlide);
  const removeSlide = useSiteSettings((s) => s.removeSlide);
  const reorderSlide = useSiteSettings((s) => s.reorderSlide);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const slides = mounted ? hero.slides ?? [] : [];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(file);
          }),
      ),
    ).then((urls) => {
      urls.forEach((url) =>
        addSlide({
          id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          image: url,
        }),
      );
      notify('success');
      flash();
    });
    e.target.value = '';
  };

  const flash = () => {
    setSavedAt(new Date().toLocaleTimeString('en-GB'));
    setTimeout(() => setSavedAt(null), 2500);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navBanner')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('heroSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2 text-sm font-semibold text-white/75 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow"
          >
            <ExternalLink className="h-4 w-4" />
            {t('viewLink')}
          </Link>
          <Button
            variant="ghost"
            size="md"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (confirm(t('resetConfirmText'))) {
                resetHero();
                notify('warning');
              }
            }}
          >
            {t('resetButton')}
          </Button>
        </div>
      </header>

      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success animate-fade-in">
          <Check className="h-4 w-4" strokeWidth={3} />
          {t('savedFlashText', { time: savedAt })}
        </div>
      )}

      <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">
            {t('slidesSectionTitle', { count: slides.length })}
          </h2>
          <button
            type="button"
            onClick={() => {
              impact('light');
              fileRef.current?.click();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-yellow px-3 py-1.5 text-xs font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110"
          >
            <Upload className="h-3.5 w-3.5" />
            {t('uploadButton')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={handleFiles}
          />
        </div>

        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-surface-border py-10 text-center">
            <ImageOff className="mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm font-semibold text-white/65">
              {t('noCustomBannerTitle')}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {t('noCustomBannerDescLine1')}<br />{t('noCustomBannerDescLine2')}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {slides.map((s, i) => (
              <SlideRow
                key={s.id}
                slide={s}
                index={i}
                total={slides.length}
                onRemove={() => {
                  removeSlide(s.id);
                  flash();
                }}
                onMove={(dir) => {
                  reorderSlide(s.id, dir);
                  flash();
                }}
                onLinkChange={(link) => {
                  setHero({
                    slides: slides.map((x) =>
                      x.id === s.id ? { ...x, link } : x,
                    ),
                  });
                  flash();
                }}
              />
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-xl border border-brand-yellow/20 bg-brand-yellow/8 p-3 text-[11px] text-white/65">
          {t.rich('tipText', {
            b: (chunks) => <strong className="text-brand-yellow">{chunks}</strong>,
            code: (chunks) => <code>{chunks}</code>,
          })}
        </div>
      </section>
    </div>
  );
}

function SlideRow({
  slide,
  index,
  total,
  onRemove,
  onMove,
  onLinkChange,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onLinkChange: (link: string) => void;
}) {
  const t = useTranslations('admin');
  const [link, setLink] = useState(slide.link ?? '');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setLink(slide.link ?? ''); setDirty(false); }, [slide.link]);

  return (
    <li className="space-y-2.5 rounded-xl border border-brand-surface-border bg-brand-dark/40 p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t('slideLabel', { number: index + 1 })}</p>
          <p className="truncate text-[10px] text-white/45">
            {slide.image.startsWith('data:') ? t('uploadedImageLabel') : slide.image}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconAction
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t('moveUpAria')}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={t('moveDownAria')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction onClick={onRemove} danger aria-label={t('deleteAria')}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          leftIcon={<Link2 className="h-3.5 w-3.5" />}
          placeholder={t('linkPlaceholder')}
          value={link}
          onChange={(e) => { setLink(e.target.value); setDirty(true); }}
        />
        <button
          type="button"
          onClick={() => { onLinkChange(link); setDirty(false); }}
          disabled={!dirty}
          aria-label={t('itemSaveBtn')}
          className={cn(
            'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-all',
            dirty
              ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110'
              : 'cursor-not-allowed bg-brand-surface-elevated text-white/35',
          )}
        >
          <Check className="h-4 w-4" />
          {t('itemSaveBtn')}
        </button>
      </div>
    </li>
  );
}

function IconAction({
  children,
  disabled,
  danger,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition-all',
        'disabled:cursor-not-allowed disabled:opacity-30',
        'hover:bg-white/8 hover:text-white',
        danger && 'hover:!bg-danger/15 hover:!text-danger',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
