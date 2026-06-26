'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/stores/cart';
import { useCheckoutState } from './useCheckoutState';
import { StepIndicator } from './StepIndicator';
import { ContactStep } from './steps/ContactStep';
import { DeliveryStep } from './steps/DeliveryStep';
import { AddressStep } from './steps/AddressStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmStep } from './steps/ConfirmStep';

export function CheckoutClient() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const step = useCheckoutState((s) => s.step);
  const setStep = useCheckoutState((s) => s.setStep);
  const delivery = useCheckoutState((s) => s.delivery);

  const STEPS = [
    t('stepContact'),
    t('stepDelivery'),
    t('stepAddress'),
    t('stepPayment'),
    t('stepConfirm'),
  ];

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  // Visible steps depend on delivery method (skip address for pickup)
  const visibleSteps =
    delivery.method === 'pickup'
      ? STEPS.filter((_, i) => i !== 2)
      : STEPS;

  // Map step index to actual step component
  const next = () => {
    if (delivery.method === 'pickup' && step === 1) {
      setStep(3); // skip address
    } else {
      setStep(Math.min(step + 1, 4));
    }
  };

  const back = () => {
    if (delivery.method === 'pickup' && step === 3) {
      setStep(1);
    } else {
      setStep(Math.max(0, step - 1));
    }
  };

  // Index in visible steps for indicator
  const visibleIndex =
    delivery.method === 'pickup' && step >= 2 ? step - 1 : step;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6 sm:px-6 sm:py-10">
      <div className="mb-8">
        <StepIndicator
          steps={visibleSteps}
          current={visibleIndex}
          onStepClick={(i) => {
            // Map visible index back to actual step
            if (delivery.method === 'pickup' && i >= 2) setStep(i + 1);
            else setStep(i);
          }}
        />
      </div>

      {step === 0 && <ContactStep onNext={next} />}
      {step === 1 && <DeliveryStep onNext={next} onBack={back} />}
      {step === 2 && <AddressStep onNext={next} onBack={back} />}
      {step === 3 && <PaymentStep onNext={next} onBack={back} />}
      {step === 4 && <ConfirmStep onBack={back} />}
    </div>
  );
}
