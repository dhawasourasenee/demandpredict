import { useEffect, useRef } from "react";

const BASE_SPACING = 24;
const MAX_DOTS = 4200;
const JITTER = 4;
const BASE_RADIUS = 0.95;
const PEAK_RADIUS = 3.35;
const CURSOR_RADIUS = 140;
const BASE_ALPHA = 0.14;
const PEAK_ALPHA = 0.42;
const SMOOTH = 0.14;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function cellHash(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type Dot = { x: number; y: number };

function buildDots(width: number, height: number, reduceMotion: boolean): Dot[] {
  let spacing = BASE_SPACING;
  let cols = Math.ceil(width / spacing) + 2;
  let rows = Math.ceil(height / spacing) + 2;
  while (cols * rows > MAX_DOTS && spacing < 48) {
    spacing += 3;
    cols = Math.ceil(width / spacing) + 2;
    rows = Math.ceil(height / spacing) + 2;
  }

  const dots: Dot[] = [];
  for (let iy = -1; iy < rows; iy++) {
    for (let ix = -1; ix < cols; ix++) {
      const bx = ix * spacing;
      const by = iy * spacing;
      const r1 = cellHash(ix, iy);
      const r2 = cellHash(ix + 17, iy + 41);
      const jx = reduceMotion ? 0 : (r1 - 0.5) * JITTER * 2;
      const jy = reduceMotion ? 0 : (r2 - 0.5) * JITTER * 2;
      dots.push({ x: bx + jx, y: by + jy });
    }
  }
  return dots;
}

/**
 * Fixed full-viewport canvas: jittered dot grid + cursor “bubble” (scale & opacity falloff).
 */
export function DotFieldBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const pointerRef = useRef({ active: false, tx: 0, ty: 0, sx: 0, sy: 0 });
  const reduceMotionRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = buildDots(w, h, reduceMotionRef.current);
    };

    const onMove = (clientX: number, clientY: number) => {
      pointerRef.current.active = true;
      pointerRef.current.tx = clientX;
      pointerRef.current.ty = clientY;
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const p = pointerRef.current;
      if (p.active && !reduceMotionRef.current) {
        p.sx += (p.tx - p.sx) * SMOOTH;
        p.sy += (p.ty - p.sy) * SMOOTH;
      }

      ctx.clearRect(0, 0, w, h);

      const mx = p.active ? p.sx : -9999;
      const my = p.active ? p.sy : -9999;
      const inkR = 42;
      const inkG = 58;
      const inkB = 150;

      for (const d of dotsRef.current) {
        let t = 0;
        if (p.active && !reduceMotionRef.current) {
          const dist = Math.hypot(d.x - mx, d.y - my);
          t = smoothstep(1 - dist / CURSOR_RADIUS);
        }
        const r = BASE_RADIUS + t * (PEAK_RADIUS - BASE_RADIUS);
        const a = BASE_ALPHA + t * (PEAK_ALPHA - BASE_ALPHA);
        ctx.fillStyle = `rgba(${inkR}, ${inkG}, ${inkB}, ${a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    syncSize();
    pointerRef.current.sx = window.innerWidth / 2;
    pointerRef.current.sy = window.innerHeight / 2;
    pointerRef.current.tx = pointerRef.current.sx;
    pointerRef.current.ty = pointerRef.current.sy;

    window.addEventListener("resize", syncSize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onLeave);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", syncSize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="dot-field-backdrop"
      aria-hidden
    />
  );
}
