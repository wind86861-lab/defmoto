'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  maxLife: number;
  size: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

const MAX_PARTICLES = 160;
// Neutral warm ash tone — reads as smoke, not as a brand color.
const SMOKE_RGB = '224, 218, 206';

export function CursorSmoke() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  useEffect(() => {
    if (isAdmin) return;
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduceMotion || !hoverCapable) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let particles: Particle[] = [];
    let lastX = 0;
    let lastY = 0;
    let hasLast = false;

    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      if (!hasLast) {
        lastX = x;
        lastY = y;
        hasLast = true;
        return;
      }
      const dist = Math.hypot(x - lastX, y - lastY);
      lastX = x;
      lastY = y;

      // Faster movement → more smoke, capped so it never floods the screen.
      const count = Math.min(5, Math.max(1, Math.round(dist / 7)));
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        particles.push({
          x: x + (Math.random() - 0.5) * 5,
          y: y + (Math.random() - 0.5) * 5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -(0.32 + Math.random() * 0.4),
          life: 1,
          maxLife: 850 + Math.random() * 550,
          size: 5 + Math.random() * 9,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.0014 + Math.random() * 0.0018,
          wobbleAmp: 0.3 + Math.random() * 0.5,
        });
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let lastFrame = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - lastFrame, 48);
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);

      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.life -= dt / p.maxLife;
        if (p.life <= 0) continue;

        p.wobblePhase += p.wobbleSpeed * dt;
        const wobble = Math.sin(p.wobblePhase) * p.wobbleAmp;
        p.x += (p.vx + wobble) * dt * 0.06;
        p.y += p.vy * dt * 0.06;

        const eased = p.life * p.life;
        const alpha = eased * 0.38;
        const size = p.size * (1 + (1 - p.life) * 1.7);

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        gradient.addColorStop(0, `rgba(${SMOKE_RGB}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${SMOKE_RGB}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 mix-blend-screen"
    />
  );
}
