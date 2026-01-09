import React, { useEffect, useRef } from 'react';

const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/=%\"'#+&^@!?~[]{}()<>|\\";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function MatrixBackground({ seedText }) {
  const canvasRef = useRef(null);
  const seedRef = useRef('');
  const stateRef = useRef({
    animationId: null,
    columns: [],
    w: 0,
    h: 0,
    lastTime: 0,
  });

  useEffect(() => {
    seedRef.current = typeof seedText === 'string' ? seedText : '';
  }, [seedText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const init = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontSize = w < 720 ? 14 : 16;
      const columnWidth = fontSize * 0.82;
      const count = Math.ceil(w / columnWidth);

      const columns = new Array(count).fill(0).map((_, i) => ({
        x: i * columnWidth,
        y: randomInt(-h, 0),
        speed: randomInt(40, 120) / 60,
        jitter: Math.random() * 1.5,
        streak: randomInt(10, 40),
        seed: Math.random() * 1000,
      }));

      stateRef.current.w = w;
      stateRef.current.h = h;
      stateRef.current.columns = columns;
      stateRef.current.lastTime = performance.now();

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
      ctx.textBaseline = 'top';
    };

    const draw = (time) => {
      const state = stateRef.current;
      const dt = Math.min(50, time - state.lastTime);
      state.lastTime = time;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, state.w, state.h);

      for (const col of state.columns) {
        col.seed += 0.015 * dt;

        const tremble = Math.sin(col.seed) * col.jitter;
        const y0 = col.y;
        for (let i = 0; i < col.streak; i++) {
          const y = y0 - i * 18;
          if (y < -40) break;

          const poolRaw = seedRef.current && seedRef.current.length > 20 ? seedRef.current : DEFAULT_CHARS;
          const pool = poolRaw.replace(/\s+/g, '');
          const ch = pool[randomInt(0, pool.length - 1)] || DEFAULT_CHARS[randomInt(0, DEFAULT_CHARS.length - 1)];
          const alpha = 1 - i / col.streak;
          const green = i === 0 ? 1.0 : 0.65;
          ctx.fillStyle = `rgba(54, 255, 127, ${Math.max(0.04, alpha * green)})`;
          ctx.fillText(ch, col.x + tremble, y);
        }

        col.y += col.speed * dt;
        if (col.y > state.h + col.streak * 18 + 20) {
          col.y = randomInt(-state.h, 0);
          col.speed = randomInt(40, 150) / 60;
          col.streak = randomInt(10, 44);
          col.jitter = Math.random() * 2.2;
        }
      }

      state.animationId = requestAnimationFrame(draw);
    };

    init();
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    stateRef.current.animationId = requestAnimationFrame(draw);

    const onResize = () => init();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (stateRef.current.animationId) cancelAnimationFrame(stateRef.current.animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrixCanvas"
      aria-hidden="true"
    />
  );
}
