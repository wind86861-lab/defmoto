'use client';

import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

/* ============================================================
 * MotoSpinner — inline wheel arc (Button, tight spaces)
 * ============================================================ */
export function MotoSpinner({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('animate-spin', className)}
      style={{ animationDuration: '0.7s' }}
      role="status"
      aria-label="Yuklanmoqda"
    >
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.18" />
      <path
        d="M 50 6 A 44 44 0 0 1 94 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  );
}

/* ============================================================
 * MotoLoader — premium DEFT MOTO loader.
 * Bright rotating energy ring + strong pulsing logo + orbit
 * ============================================================ */
const LOGO_ASPECT = 279 / 181;

const sizeMap: Record<Size, { logo: number; ring: number }> = {
  sm: { logo: 56, ring: 140 },
  md: { logo: 90, ring: 220 },
  lg: { logo: 130, ring: 300 },
  xl: { logo: 180, ring: 400 },
};

interface MotoLoaderProps {
  size?: Size;
  className?: string;
  label?: string;
}

export function MotoLoader({ size = 'md', className, label }: MotoLoaderProps) {
  const { logo, ring } = sizeMap[size];
  const logoW = logo * LOGO_ASPECT;
  const logoH = logo;
  // Ring stroke proportional to size
  const stroke = Math.max(4, ring * 0.025);

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: ring, height: ring }}
        role="status"
        aria-label={label ?? 'Yuklanmoqda'}
      >
        {/* ───── Background halo ───── */}
        <div
          className="absolute inset-0 animate-loader-halo rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,184,0,0.55) 0%, rgba(255,184,0,0.18) 30%, rgba(255,184,0,0.04) 55%, transparent 70%)',
          }}
        />

        {/* ───── Bright rotating energy ring (conic gradient) ───── */}
        <div
          className="absolute inset-0 animate-loader-spin-fast rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 200deg, #FFB800 280deg, #FFE066 320deg, #FFB800 360deg)',
            mask: `radial-gradient(circle, transparent calc(50% - ${stroke}px), #000 calc(50% - ${stroke}px), #000 50%, transparent 50%)`,
            WebkitMask: `radial-gradient(circle, transparent calc(50% - ${stroke}px), #000 calc(50% - ${stroke}px), #000 50%, transparent 50%)`,
            filter: `drop-shadow(0 0 ${stroke * 1.5}px rgba(255,184,0,0.7))`,
          }}
        />

        {/* ───── Counter-rotating thinner ring ───── */}
        <div
          className="absolute inset-[8%] animate-loader-spin-slow-reverse rounded-full"
          style={{
            background:
              'conic-gradient(from 90deg, transparent 0deg, transparent 240deg, #FFE066 300deg, #FFB800 340deg, transparent 360deg)',
            mask: `radial-gradient(circle, transparent calc(50% - ${stroke * 0.4}px), #000 calc(50% - ${stroke * 0.4}px), #000 50%, transparent 50%)`,
            WebkitMask: `radial-gradient(circle, transparent calc(50% - ${stroke * 0.4}px), #000 calc(50% - ${stroke * 0.4}px), #000 50%, transparent 50%)`,
            opacity: 0.7,
          }}
        />

        {/* ───── Orbiting dots ───── */}
        <div className="absolute inset-[14%] animate-loader-spin-slow">
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-brand-yellow"
            style={{
              width: stroke * 1.4,
              height: stroke * 1.4,
              boxShadow: `0 0 ${stroke * 2}px rgba(255,184,0,1), 0 0 ${stroke * 4}px rgba(255,184,0,0.6)`,
            }}
          />
        </div>
        <div className="absolute inset-[14%] animate-loader-spin-slow" style={{ animationDelay: '-0.7s' }}>
          <span
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-brand-yellow"
            style={{
              width: stroke * 0.8,
              height: stroke * 0.8,
              boxShadow: `0 0 ${stroke * 1.5}px rgba(255,184,0,1)`,
              opacity: 0.7,
            }}
          />
        </div>

        {/* ───── Radial burst rays (sweeping) ───── */}
        <div className="absolute inset-0 animate-loader-spin-medium overflow-hidden rounded-full">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <span
              key={angle}
              className="absolute left-1/2 top-1/2 origin-left"
              style={{
                width: '50%',
                height: 1,
                transform: `rotate(${angle}deg)`,
                background:
                  'linear-gradient(to right, transparent 0%, transparent 55%, rgba(255,184,0,0.8) 80%, transparent 100%)',
              }}
            />
          ))}
        </div>

        {/* ───── Smoke trail echoes ───── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-mark.png"
          alt=""
          aria-hidden="true"
          className="absolute animate-loader-smoke-trail-1 object-contain opacity-40 blur-[14px]"
          style={{ width: logoW, height: logoH }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-mark.png"
          alt=""
          aria-hidden="true"
          className="absolute animate-loader-smoke-trail-2 object-contain opacity-25 blur-[28px]"
          style={{ width: logoW * 1.2, height: logoH * 1.2 }}
        />

        {/* ───── Primary logo ───── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-mark.png"
          alt=""
          aria-hidden="true"
          className="relative z-10 animate-loader-logo object-contain"
          style={{ width: logoW, height: logoH }}
        />
      </div>

      {/* ───── Shimmering label ───── */}
      {label && (
        <div className="flex items-center gap-2.5">
          <span
            className="h-px w-8 bg-gradient-to-r from-transparent to-brand-yellow opacity-60"
          />
          <p
            className="bg-clip-text text-xs font-bold uppercase tracking-[0.32em] text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(255,184,0,0.35) 0%, #FFE066 25%, #FFB800 50%, #FFE066 75%, rgba(255,184,0,0.35) 100%)',
              backgroundSize: '200% 100%',
              animation: 'loader-shimmer 1.8s linear infinite',
            }}
          >
            {label}
          </p>
          <span
            className="h-px w-8 bg-gradient-to-l from-transparent to-brand-yellow opacity-60"
          />
        </div>
      )}

      <style jsx>{`
        @keyframes loader-halo {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
        @keyframes loader-spin-fast {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loader-spin-medium {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loader-spin-slow {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loader-spin-slow-reverse {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes loader-logo {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 18px rgba(255, 184, 0, 0.7))
              drop-shadow(0 14px 28px rgba(0, 0, 0, 0.6));
          }
          50% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 38px rgba(255, 184, 0, 1))
              drop-shadow(0 0 70px rgba(255, 140, 0, 0.5))
              drop-shadow(0 14px 28px rgba(0, 0, 0, 0.6));
          }
        }
        @keyframes loader-smoke-trail-1 {
          0%,
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.12) translateY(-4px);
            opacity: 0.65;
          }
        }
        @keyframes loader-smoke-trail-2 {
          0%,
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.18) translateY(-8px);
            opacity: 0.45;
          }
        }
        @keyframes loader-shimmer {
          to {
            background-position: -200% 0;
          }
        }
        :global(.animate-loader-halo) {
          animation: loader-halo 1.8s ease-in-out infinite;
        }
        :global(.animate-loader-spin-fast) {
          animation: loader-spin-fast 1.4s linear infinite;
        }
        :global(.animate-loader-spin-medium) {
          animation: loader-spin-medium 3s linear infinite;
        }
        :global(.animate-loader-spin-slow) {
          animation: loader-spin-slow 2.4s linear infinite;
        }
        :global(.animate-loader-spin-slow-reverse) {
          animation: loader-spin-slow-reverse 3.2s linear infinite;
        }
        :global(.animate-loader-logo) {
          animation: loader-logo 1.6s ease-in-out infinite;
        }
        :global(.animate-loader-smoke-trail-1) {
          animation: loader-smoke-trail-1 1.8s ease-in-out infinite;
        }
        :global(.animate-loader-smoke-trail-2) {
          animation: loader-smoke-trail-2 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * FullScreenLoader — backdrop overlay wrapper
 * ============================================================ */
export function FullScreenLoader({ label = 'Yuklanmoqda' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-dark/90 backdrop-blur-md">
      <MotoLoader size="xl" label={label} />
    </div>
  );
}

/* ============================================================
 * Legacy aliases — all variants route to MotoLoader.
 * ============================================================ */
export const RoadDashLoader = MotoLoader;
export const WheelLoader = MotoLoader;
export const ChevronLoader = MotoLoader;
export const SpeedometerLoader = MotoLoader;
export const LogoPulseLoader = MotoLoader;
