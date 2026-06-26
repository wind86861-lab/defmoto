'use client';

import { useCallback } from 'react';
import { useTelegram } from '@/components/providers/TelegramProvider';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'success' | 'error' | 'warning';

export function useHaptic() {
  const { haptic } = useTelegram();

  const impact = useCallback(
    (style: ImpactStyle = 'light') => {
      haptic?.impactOccurred(style);
    },
    [haptic],
  );

  const notify = useCallback(
    (type: NotificationType) => {
      haptic?.notificationOccurred(type);
    },
    [haptic],
  );

  const selection = useCallback(() => {
    haptic?.selectionChanged();
  }, [haptic]);

  return { impact, notify, selection };
}
