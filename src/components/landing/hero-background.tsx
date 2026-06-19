"use client";

import { useEffect, useRef } from "react";

type Orb = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.4 });
  const orbsRef = useRef<Orb[]>([]);
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    orbsRef.current = [
      {
        baseX: 0.25,
        baseY: 0.35,
        x: 0.25,
        y: 0.35,
        radius: 0.45,
        color: "rgba(167, 139, 250, 0.35)",
        phase: 0,
      },
      {
        baseX: 0.75,
        baseY: 0.55,
        x: 0.75,
        y: 0.55,
        radius: 0.4,
        color: "rgba(56, 189, 248, 0.3)",
        phase: 1.5,
      },
      {
        baseX: 0.5,
        baseY: 0.7,
        x: 0.5,
        y: 0.7,
        radius: 0.35,
        color: "rgba(139, 92, 246, 0.25)",
        phase: 3,
      },
    ];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawStatic = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      for (const orb of orbsRef.current) {
        const cx = orb.baseX * w;
        const cy = orb.baseY * h;
        const r = orb.radius * Math.max(w, h);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }
    };

    const draw = (time: number) => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const { x: mx, y: my } = mouseRef.current;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      for (const orb of orbsRef.current) {
        const driftX =
          Math.sin(time * 0.0003 + orb.phase) * 0.04 +
          Math.cos(time * 0.0002 + orb.phase * 2) * 0.02;
        const driftY =
          Math.cos(time * 0.00025 + orb.phase) * 0.03 +
          Math.sin(time * 0.00015 + orb.phase) * 0.02;

        const targetX = lerp(orb.baseX + driftX, mx, 0.15);
        const targetY = lerp(orb.baseY + driftY, my, 0.15);

        orb.x = lerp(orb.x, targetX, 0.02);
        orb.y = lerp(orb.y, targetY, 0.02);

        const cx = orb.x * w;
        const cy = orb.y * h;
        const r = orb.radius * Math.max(w, h);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, "0.08)"));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: 0.5, y: 0.4 };
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reducedMotionRef.current) {
      drawStatic();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
