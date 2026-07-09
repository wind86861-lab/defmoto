'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAdminAuth } from '@/lib/stores/admin';
import { useHaptic } from '@/hooks/useHaptic';

export default function AdminLoginPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const markAuthed = useAdminAuth((s) => s.markAuthed);
  const { notify } = useHaptic();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let ok = false;
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setLoading(false);
    if (ok) {
      markAuthed();
      notify('success');
      router.replace('/admin');
    } else {
      notify('error');
      setError(t('wrongPasswordError'));
      setPassword('');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-dark px-4 py-10">
      {/* BG accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-brand-yellow/15 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-brand-yellow-glow/12 blur-[140px]" />
        <div className="absolute inset-0 bg-noise opacity-[0.05]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>

        <div className="rounded-3xl border border-brand-surface-border bg-brand-surface p-6 shadow-card sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/15 text-brand-yellow shadow-glow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-extrabold">
              {t('loginTitle')}
            </h1>
            <p className="mt-1 text-sm text-white/55">
              {t('loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder={t('usernamePlaceholder')}
              leftIcon={<User className="h-4 w-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <Input
              type={showPwd ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="text-white/55 hover:text-brand-yellow"
                  aria-label={showPwd ? t('hidePasswordAria') : t('showPasswordAria')}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ?? undefined}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              glow
              fullWidth
              loading={loading}
              disabled={username.length < 2 || password.length < 4}
            >
              {t('loginButton')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
