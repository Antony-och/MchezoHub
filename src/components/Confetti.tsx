import React, { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
}

export const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const colors = ['#dc2626', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#2563eb'];
    const pieces: ConfettiPiece[] = [];

    // Spawn 90 pieces
    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: w * 0.5 + (Math.random() * 200 - 100),
        y: h * 0.4 + (Math.random() * 100 - 50),
        w: Math.random() * 8 + 6,
        h: Math.random() * 10 + 6,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 15,
        opacity: 1,
      });
    }

    let animId: number;
    let frames = 0;

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      frames++;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.vRot;

        if (frames > 40) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frames < 140) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
