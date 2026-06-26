'use client';

import { MapPin, Home, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCheckoutState } from '../useCheckoutState';

export function AddressStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('checkout');
  const { address, setAddress, delivery } = useCheckoutState();

  const cities = [
    t('cityTashkent'),
    t('citySamarkand'),
    t('cityBukhara'),
    t('cityAndijan'),
    t('cityFergana'),
    t('cityNamangan'),
  ];

  // Skip this step entirely if pickup
  if (delivery.method === 'pickup') {
    onNext();
    return null;
  }

  const canContinue = address.city && address.street.trim().length >= 3;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">
          {t('addressTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {t('addressSubtitle')}
        </p>
      </header>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
            {t('cityLabel')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAddress({ city: c })}
                className={`h-10 rounded-lg border text-sm font-semibold transition-colors touch-feedback ${
                  address.city === c
                    ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow shadow-glow-sm'
                    : 'border-brand-surface-border bg-brand-surface text-white/75 hover:border-brand-yellow/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Input
          placeholder={t('streetPlaceholder')}
          leftIcon={<MapPin className="h-4 w-4" />}
          value={address.street}
          onChange={(e) => setAddress({ street: e.target.value })}
        />

        <Input
          placeholder={t('apartmentPlaceholder')}
          leftIcon={<Home className="h-4 w-4" />}
          value={address.apartment ?? ''}
          onChange={(e) => setAddress({ apartment: e.target.value })}
        />

        <Input
          placeholder={t('notePlaceholder')}
          leftIcon={<FileText className="h-4 w-4" />}
          value={address.note ?? ''}
          onChange={(e) => setAddress({ note: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" onClick={onBack} className="flex-1">
          {t('back')}
        </Button>
        <Button size="xl" glow onClick={onNext} className="flex-[2]" disabled={!canContinue}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
