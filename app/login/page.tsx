'use client';

import { useRouter } from 'next/navigation';
import { AuthScreen } from '@/features/auth/AuthScreen';

export default function LoginPage() {
  const router = useRouter();
  return (
    <AuthScreen
      onDone={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dm-auth-changed'));
        }
        router.back();
      }}
    />
  );
}
