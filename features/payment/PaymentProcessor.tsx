'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Check,
  ShieldCheck,
  X,
  AlertTriangle,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { MotoSpinner } from '@/components/ui/MotoLoader';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { useHaptic } from '@/hooks/useHaptic';
import { useOrdersStore } from '@/lib/stores/orders';
import { getAdapter } from './adapters';
import { paymentProviders } from '@/types/payment';
import type { PaymentErrorCode, PaymentRequest, PaymentStatus } from '@/types/payment';

interface PaymentProcessorProps {
  open: boolean;
  request: PaymentRequest;
  onClose: () => void;
  onSuccess?: (transactionId: string) => void;
}

export function PaymentProcessor({
  open,
  request,
  onClose,
  onSuccess,
}: PaymentProcessorProps) {
  const t = useTranslations('payment');
  const router = useRouter();
  const provider = paymentProviders[request.method];
  const markPaid = useOrdersStore((s) => s.markPaid);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const { notify, impact } = useHaptic();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const statusLabels: Record<PaymentStatus, string> = {
    idle: '',
    redirecting: t('redirecting'),
    pending: t('pending'),
    processing: t('processing'),
    success: t('success'),
    failed: t('failed'),
    cancelled: t('cancelled'),
  };

  const statusSub: Record<PaymentStatus, string> = {
    idle: '',
    redirecting: t('subRedirecting'),
    pending: t('subPending'),
    processing: t('subProcessing'),
    success: t('subSuccess'),
    failed: t('subFailed'),
    cancelled: t('subCancelled'),
  };

  const errorMessages: Record<PaymentErrorCode, string> = {
    insufficient_funds: t('errorInsufficientFunds'),
    invalid_card: t('errorInvalidCard'),
    network: t('errorNetwork'),
    cancelled_by_user: t('errorCancelledByUser'),
    timeout: t('errorTimeout'),
    unknown: t('errorUnknown'),
  };

  // Trigger payment when modal opens
  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError(null);
      setTxId(null);
      return;
    }

    let cancelled = false;
    const adapter = getAdapter(request.method);

    (async () => {
      const result = await adapter.pay(request, (s) => {
        if (!cancelled) setStatus(s);
      });

      if (cancelled) return;

      if (result.ok) {
        notify('success');
        setTxId(result.transactionId ?? null);
        if (request.method === 'cash') {
          updateStatus(request.orderId, 'confirmed');
        } else {
          markPaid(request.orderId, result.transactionId);
        }
        onSuccess?.(result.transactionId ?? '');
      } else {
        notify('error');
        setError(errorMessages[result.error?.code ?? 'unknown']);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, request, notify, markPaid, updateStatus, onSuccess]);

  const handleRetry = () => {
    impact('medium');
    setStatus('idle');
    setError(null);
    // Re-trigger by toggling
    setTimeout(() => setStatus('redirecting'), 50);
    const adapter = getAdapter(request.method);
    adapter.pay(request, (s) => setStatus(s)).then((result) => {
      if (result.ok) {
        notify('success');
        setTxId(result.transactionId ?? null);
        if (request.method === 'cash') {
          updateStatus(request.orderId, 'confirmed');
        } else {
          markPaid(request.orderId, result.transactionId);
        }
        onSuccess?.(result.transactionId ?? '');
      } else {
        notify('error');
        setError(errorMessages[result.error?.code ?? 'unknown']);
      }
    });
  };

  const handleSuccessClose = () => {
    onClose();
    router.push(`/orders/${request.orderId}`);
  };

  const progressPct = useMemo(() => {
    switch (status) {
      case 'redirecting':
        return 25;
      case 'pending':
        return 55;
      case 'processing':
        return 85;
      case 'success':
        return 100;
      case 'failed':
      case 'cancelled':
        return 100;
      default:
        return 0;
    }
  }, [status]);

  const isDone = status === 'success' || status === 'failed' || status === 'cancelled';
  const allowClose = isDone;

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (allowClose) onClose();
      }}
      side="bottom"
    >
      <div className="px-5 pb-6 pt-2 sm:px-6">
        {/* Provider header */}
        <div
          className="relative -mx-5 mb-6 overflow-hidden rounded-t-3xl p-6 text-white sm:-mx-6"
          style={{ background: provider.bgGradient }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md font-display text-base font-extrabold">
              {provider.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {t('providerLabel')}
              </div>
              <div className="font-display text-2xl font-extrabold">
                {provider.name}
              </div>
            </div>
            {allowClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('closeAriaLabel')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white transition-colors hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative mt-4 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {t('orderLabel')}
              </div>
              <div className="font-display text-base font-extrabold">
                #{request.orderNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {t('amountLabel')}
              </div>
              <div className="font-display text-2xl font-extrabold">
                {formatPrice(request.amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Status display */}
        <div className="flex flex-col items-center text-center">
          <StatusIcon
            status={status}
            color={provider.color}
            error={Boolean(error)}
          />

          <h3 className="mt-5 font-display text-xl font-extrabold sm:text-2xl">
            {error ? statusLabels.failed : statusLabels[status] || statusLabels.redirecting}
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-white/55">
            {error ?? statusSub[status]}
          </p>

          {/* Progress bar */}
          {!isDone && (
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-brand-surface-elevated">
              <div
                className="h-full rounded-full transition-all duration-700 ease-spring"
                style={{
                  width: `${progressPct}%`,
                  background: provider.bgGradient,
                  boxShadow: `0 0 12px ${provider.color}66`,
                }}
              />
            </div>
          )}

          {/* Tx id */}
          {txId && status === 'success' && (
            <div className="mt-5 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2 text-[11px]">
              <span className="font-bold text-white/45">{t('txIdLabel')}</span>{' '}
              <span className="font-mono text-white/85">{txId}</span>
            </div>
          )}
        </div>

        {/* Security note */}
        {!isDone && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface/60 px-3 py-2.5 text-[11px] text-white/55">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            <span>{t('securityNote')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2">
          {status === 'success' && (
            <Button
              size="xl"
              glow
              fullWidth
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={handleSuccessClose}
            >
              {t('viewOrderButton')}
            </Button>
          )}

          {status === 'failed' && (
            <>
              <Button
                size="xl"
                glow
                fullWidth
                leftIcon={<CreditCard className="h-5 w-5" />}
                onClick={handleRetry}
              >
                {t('retryButton')}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                fullWidth
                onClick={onClose}
              >
                {t('chooseAnotherMethod')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function StatusIcon({
  status,
  color,
  error,
}: {
  status: PaymentStatus;
  color: string;
  error: boolean;
}) {
  if (error || status === 'failed' || status === 'cancelled') {
    return (
      <div className="relative">
        <div className="absolute inset-0 -z-10 m-auto h-24 w-24 animate-pulse rounded-full bg-danger/30 blur-2xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-danger to-danger/70 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]">
          <AlertTriangle className="h-10 w-10" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="relative">
        <div className="absolute inset-0 -z-10 m-auto h-24 w-24 animate-pulse rounded-full bg-success/40 blur-2xl" />
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-success to-success/70 text-white shadow-[0_0_48px_rgba(34,197,94,0.6)]',
            'animate-scale-in',
          )}
        >
          <Check className="h-12 w-12" strokeWidth={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute inset-0 -z-10 m-auto h-24 w-24 animate-pulse rounded-full blur-2xl"
        style={{ backgroundColor: `${color}40` }}
      />
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white"
        style={{ background: color }}
      >
        <MotoSpinner size={44} />
      </div>
    </div>
  );
}
