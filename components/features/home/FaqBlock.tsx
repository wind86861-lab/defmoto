'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

const faqs = [
  {
    q: 'Buyurtmani qanday qilaman?',
    a: 'Tovarni savatga qo\'shing, "Buyurtma berish" tugmasini bosing, Telegram orqali telefon raqamingizni ulashing va to\'lov usulini tanlang. Tasdiqlangan buyurtma haqida Telegram orqali xabar olasiz.',
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: 'Click, Payme, BTS yoki kuryerga naqd to\'lash mumkin. Onlayn to\'lovlar shifrlangan va xavfsiz.',
  },
  {
    q: 'Yetkazib berish qancha vaqt oladi?',
    a: 'Toshkent ichida 1-2 ish kuni, viloyatlarga 3-5 ish kuni. Filialdan olib ketish — darhol.',
  },
  {
    q: 'Tovarni qaytarib berish mumkinmi?',
    a: 'Ha, qabul qilingandan keyin 14 kun ichida (tovar yangi va asl qadog\'ida bo\'lsa).',
  },
  {
    q: 'Kafolat shartlari qanday?',
    a: "Barcha rasmiy tovarlarga ishlab chiqaruvchining kafolati (mototsikllar — 1 yildan 3 yilgacha, ehtiyot qismlar — 3-6 oy).",
  },
  {
    q: "Servisga qanday yozilaman?",
    a: "Servis sahifasiga o'ting yoki bevosita servis chati orqali murojaat qiling. Operator 15 daqiqada javob beradi.",
  },
];

export function FaqBlock() {
  const t = useTranslations('home');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('faq')}
          </h2>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            Eng ko&apos;p so&apos;raladigan savollarga javoblar
          </p>
        </header>

        {/* 2 columns on md+ */}
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className={cn(
                  'overflow-hidden rounded-2xl border transition-all duration-300 self-start',
                  isOpen
                    ? 'border-brand-yellow/40 bg-brand-yellow/5 shadow-glow-sm'
                    : 'border-brand-surface-border bg-brand-surface',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left no-tap-highlight sm:p-5"
                >
                  <span
                    className={cn(
                      'text-sm font-semibold sm:text-base',
                      isOpen ? 'text-brand-yellow' : 'text-white',
                    )}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                      isOpen
                        ? 'bg-brand-yellow text-brand-dark'
                        : 'bg-brand-surface-elevated text-white/60',
                    )}
                  >
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                  </div>
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-300 ease-spring',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm leading-relaxed text-white/65 sm:px-5 sm:pb-5">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
