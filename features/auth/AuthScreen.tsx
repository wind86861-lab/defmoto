'use client';

import { useState } from 'react';
import { Phone, Lock, User, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useHaptic } from '@/hooks/useHaptic';

type Mode = 'login' | 'register' | 'forgot';

async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: j as Record<string, unknown> };
}

export function AuthScreen({ onDone }: { onDone: () => void }) {
  const { notify } = useHaptic();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // forgot flow
  const [forgotStep, setForgotStep] = useState<'phone' | 'code'>('phone');
  const [botLink, setBotLink] = useState('');
  const [code, setCode] = useState('');

  const submitLogin = async () => {
    setBusy(true);
    setError('');
    const { ok } = await post('/api/auth/login', { phone, password });
    setBusy(false);
    if (ok) {
      notify('success');
      onDone();
    } else {
      notify('error');
      setError('Telefon yoki parol notoʻgʻri.');
    }
  };

  const submitRegister = async () => {
    setBusy(true);
    setError('');
    const { ok, status } = await post('/api/auth/register', { name, phone, password });
    setBusy(false);
    if (ok) {
      notify('success');
      onDone();
    } else {
      notify('error');
      setError(status === 409 ? 'Bu raqam allaqachon roʻyxatdan oʻtgan.' : 'Maʼlumotlar notoʻgʻri (parol kamida 6 belgi).');
    }
  };

  const startForgot = async () => {
    setBusy(true);
    setError('');
    const { ok, status, data } = await post('/api/auth/forgot', { phone });
    setBusy(false);
    if (ok) {
      setBotLink((data.botLink as string) || '');
      setForgotStep('code');
    } else {
      setError(status === 404 ? 'Bu raqam boʻyicha hisob topilmadi.' : 'Xatolik. Qayta urinib koʻring.');
    }
  };

  const submitReset = async () => {
    setBusy(true);
    setError('');
    const { ok } = await post('/api/auth/reset', { code, password });
    setBusy(false);
    if (ok) {
      notify('success');
      onDone();
    } else {
      notify('error');
      setError('Kod notoʻgʻri yoki eskirgan.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-brand-dark px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-white/55">
            {mode === 'register'
              ? 'Yangi hisob yarating'
              : mode === 'forgot'
                ? 'Parolni tiklash'
                : 'Hisobingizga kiring'}
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-brand-surface-border bg-brand-surface p-5">
          {mode === 'forgot' ? (
            forgotStep === 'phone' ? (
              <>
                <Field icon={Phone}>
                  <input {...inp} type="tel" placeholder="+998 90 000 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                {error && <ErrorText>{error}</ErrorText>}
                <Button glow fullWidth size="lg" loading={busy} onClick={startForgot} disabled={phone.replace(/\D/g, '').length < 9}>
                  Kod olish
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-white/60">
                  Kodni olish uchun Telegram botni oching va kontaktingizni yuboring — bot sizga tasdiqlash kodini yuboradi.
                </p>
                {botLink && (
                  <a href={botLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white">
                    <Send className="h-4 w-4" /> Telegram orqali tasdiqlash
                  </a>
                )}
                <Field icon={Lock}>
                  <input {...inp} inputMode="numeric" placeholder="Tasdiqlash kodi" value={code} onChange={(e) => setCode(e.target.value)} />
                </Field>
                <Field icon={Lock}>
                  <input {...inp} type="password" placeholder="Yangi parol" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                {error && <ErrorText>{error}</ErrorText>}
                <Button glow fullWidth size="lg" loading={busy} onClick={submitReset} disabled={code.length < 4 || password.length < 6}>
                  Parolni yangilash
                </Button>
              </>
            )
          ) : (
            <>
              {mode === 'register' && (
                <Field icon={User}>
                  <input {...inp} placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              )}
              <Field icon={Phone}>
                <input {...inp} type="tel" placeholder="+998 90 000 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field icon={Lock}>
                <input {...inp} type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {error && <ErrorText>{error}</ErrorText>}
              <Button glow fullWidth size="lg" loading={busy} onClick={mode === 'register' ? submitRegister : submitLogin}>
                {mode === 'register' ? 'Roʻyxatdan oʻtish' : 'Kirish'}
              </Button>
              {mode === 'login' && (
                <button type="button" onClick={() => { setMode('forgot'); setForgotStep('phone'); setError(''); }} className="w-full text-center text-xs text-white/50 hover:text-brand-yellow">
                  Parolni unutdingizmi?
                </button>
              )}
            </>
          )}
        </div>

        {/* Mode switch */}
        <div className="mt-5 text-center text-sm text-white/60">
          {mode === 'forgot' ? (
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="inline-flex items-center gap-1 font-semibold text-brand-yellow">
              <ArrowLeft className="h-3.5 w-3.5" /> Kirishga qaytish
            </button>
          ) : mode === 'login' ? (
            <>
              Hisobingiz yoʻqmi?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }} className="font-semibold text-brand-yellow">
                Roʻyxatdan oʻting
              </button>
            </>
          ) : (
            <>
              Hisobingiz bormi?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-semibold text-brand-yellow">
                Kiring
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = {
  className: 'w-full bg-transparent text-base text-white placeholder:text-white/35 outline-none',
};

function Field({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-brand-surface-border bg-brand-dark/60 px-3.5 py-3 focus-within:border-brand-yellow/50">
      <Icon className="h-4 w-4 shrink-0 text-white/40" />
      {children}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-danger">{children}</p>;
}
