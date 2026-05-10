import { useEffect, useRef } from "react";

/** Matches --accent-bright (#2563eb) */
const DOT_R = 37;
const DOT_G = 99;
const DOT_B = 235;

const BASE_SPACING = 24;
const MAX_DOTS = 4200;
const JITTER = 4;
/** 2× previous default radii */
const BASE_RADIUS = 1.9;
const PEAK_RADIUS = 6.7;
const CURSOR_RADIUS = 175;
const BASE_ALPHA = 0.16;
const PEAK_ALPHA = 0.52;
const SMOOTH = 0.14;

/** Repel dots from cursor (px at full influence) */
const REPULSE_MAX = 28;
/** Perpendicular wobble amplitude (px) */
const WOBBLE_AMP = 7;
/** Extra swirl from cursor movement */
const SWIRL_SCALE = 2.8;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function cellHash(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type Dot = { ox: number; oy: number; phase: number };

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
      const phase = r1 * Math.PI * 2;
      dots.push({ ox: bx + jx, oy: by + jy, phase });
    }
  }
  return dots;
}

/**
 * Full-viewport canvas: jittered grid, accent-blue dots, cursor repel + wobble + motion swirl.
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
      const reduce = reduceMotionRef.current;

      const prevSx = p.sx;
      const prevSy = p.sy;
      if (p.active && !reduce) {
        p.sx += (p.tx - p.sx) * SMOOTH;
        p.sy += (p.ty - p.sy) * SMOOTH;
      }
      const velX = p.sx - prevSx;
      const velY = p.sy - prevSy;
      const velMag = Math.hypot(velX, velY);

      ctx.clearRect(0, 0, w, h);

      const mx = p.active ? p.sx : -9999;
      const my = p.active ? p.sy : -9999;
      const tNow = performance.now() * 0.002;

      for (const d of dotsRef.current) {
        let px = d.ox;
        let py = d.oy;
        let t = 0;

        if (p.active && !reduce) {
          const dx = d.ox - mx;
          const dy = d.oy - my;
          const dist = Math.hypot(dx, dy) || 1e-6;
          t = smoothstep(1 - dist / CURSOR_RADIUS);

          const ux = dx / dist;
          const uy = dy / dist;
          // Repel outward (stronger when close); tiny breathing for “alive” feel
          const repel =
            t *
            REPULSE_MAX *
            (0.85 + 0.15 * Math.sin(tNow * 4 + d.phase));
          px += ux * repel;
          py += uy * repel;

          // Ripple + perpendicular wobble (dots feel like they churn around the cursor)
          const perpX = -uy;
          const perpY = ux;
          const wave = Math.sin(dist * 0.09 - tNow * 6 + d.phase);
          const wob = t * WOBBLE_AMP;
          px += perpX * Math.sin(tNow * 5.5 + d.phase + dist * 0.06) * wob;
          py += perpY * Math.cos(tNow * 5 + d.phase * 1.1 + dist * 0.05) * wob;
          px += ux * wave * t * 3.5;

          // React to cursor travel direction (swirl)
          if (velMag > 0.02) {
            const vx = velX / velMag;
            const vy = velY / velMag;
            const tangX = -vy;
            const tangY = vx;
            const swirl = t * velMag * SWIRL_SCALE;
            px += tangX * swirl * (0.6 + 0.4 * Math.sin(d.phase + tNow * 3));
            py += tangY * swirl * (0.6 + 0.4 * Math.cos(d.phase + tNow * 3));
          }
        }

        const pulse = p.active && !reduce ? 1 + t * 0.22 * Math.sin(tNow * 9 + d.phase) : 1;
        const r = (BASE_RADIUS + t * (PEAK_RADIUS - BASE_RADIUS)) * pulse;
        const a = BASE_ALPHA + t * (PEAK_ALPHA - BASE_ALPHA);

        ctx.fillStyle = `rgba(${DOT_R}, ${DOT_G}, ${DOT_B}, ${a})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
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
