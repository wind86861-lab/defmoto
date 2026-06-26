'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

const MAX_PARTICLES = 45;
// Same neutral warm-ash tone as the cursor trail, for visual consistency.
const SMOKE_RGB = '224, 218, 206';

export function FooterSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const container = canvas?.parentElement;
    if (!canvas || !ctx || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let particles: Particle[] = [];
    let visible = false;

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(container);

    let lastFrame = performance.now();
    let lastSpawn = lastFrame;
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - lastFrame, 48);
      lastFrame = now;

      if (!visible) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (now - lastSpawn > 260 + Math.random() * 260 && particles.length < MAX_PARTICLES) {
        lastSpawn = now;
        particles.push({
          x: width * (0.1 + Math.random() * 0.8),
          y: height * (0.85 + Math.random() * 0.15),
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(0.15 + Math.random() * 0.2),
          life: 1,
          maxLife: 3200 + Math.random() * 2200,
          size: 12 + Math.random() * 18,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.0007 + Math.random() * 0.001,
          wobbleAmp: 0.4 + Math.random() * 0.6,
        });
      }

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
        const alpha = eased * 0.32;
        const size = p.size * (1 + (1 - p.life) * 1.8);

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
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mix-blend-screen"
    />
  );
}
