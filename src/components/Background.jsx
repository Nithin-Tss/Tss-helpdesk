import { useEffect, useRef } from "react";

/*
 * Decorative, interactive background. Layers, back to front:
 *  - soft colour orbs (CSS, behind the page content)
 *  - drawn above the content on a click-through canvas, so it is visible over cards too:
 *  - a glow and ring that follow the pointer
 *  - a network of coloured dots; dots near the pointer link to it and move away from it
 *  - click or tap sends a ripple that shoves nearby dots outward
 * Purely visual: ignores pointer events and stays still when the visitor prefers reduced motion.
 */
const LINK = 140; // max distance between two linked dots
const REACH = 190; // pointer influence radius
const PALETTE = ["79, 70, 229", "14, 165, 233", "139, 92, 246", "100, 116, 139"]; // indigo, sky, violet, slate

export default function Background({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, gx: -9999, gy: -9999, on: false };
    let dots = [];
    let ripples = [];
    let w = 0;
    let h = 0;
    let t = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      // CSS size must equal the viewport; the bitmap is dpr times larger for sharpness
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.round((w * h) / 13000), 130);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.3 + Math.random() * 1.9,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const glow = (x, y, r, c, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c}, ${a})`);
      g.addColorStop(1, `rgba(${c}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    const step = () => {
      t += 0.01;
      // the glow trails the pointer
      pointer.gx += (pointer.x - pointer.gx) * 0.12;
      pointer.gy += (pointer.y - pointer.gy) * 0.12;
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        if (pointer.on) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 0) {
            const push = ((REACH - dist) / REACH) * 1.1;
            d.x += (dx / dist) * push;
            d.y += (dy / dist) * push;
          }
        }
        for (const rp of ripples) {
          const dx = d.x - rp.x;
          const dy = d.y - rp.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && Math.abs(dist - rp.r) < 40) {
            d.x += (dx / dist) * 2.2 * rp.life;
            d.y += (dy / dist) * 2.2 * rp.life;
          }
        }
      }
      for (const rp of ripples) {
        rp.r += 7;
        rp.life -= 0.018;
      }
      ripples = ripples.filter((rp) => rp.life > 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (pointer.on) {
        glow(pointer.gx, pointer.gy, 200, "79, 70, 229", 0.12);
        // marks the exact pointer position so the effect visibly follows the cursor
        ctx.strokeStyle = "rgba(79, 70, 229, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 9 + 2 * Math.sin(t * 4), 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${a.c}, ${0.26 * (1 - dist / LINK)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const pd = pointer.on ? Math.hypot(a.x - pointer.x, a.y - pointer.y) : Infinity;
        if (pd < REACH * 1.4) {
          ctx.strokeStyle = `rgba(${a.c}, ${0.7 * (1 - pd / (REACH * 1.4))})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
        const near = pd < REACH;
        const pulse = 0.6 + 0.4 * Math.sin(t * 3 + a.phase);
        if (near) glow(a.x, a.y, a.r * 6, a.c, 0.35);
        ctx.fillStyle = `rgba(${a.c}, ${near ? 0.95 : 0.35 + 0.25 * pulse})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, near ? a.r * 1.4 : a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const rp of ripples) {
        ctx.strokeStyle = `rgba(79, 70, 229, ${0.35 * rp.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (still) draw();
      else if (!document.hidden) loop();
    };
    const move = (e) => {
      if (!pointer.on) {
        pointer.gx = e.clientX;
        pointer.gy = e.clientY;
      }
      pointer.on = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const leave = () => {
      pointer.on = false;
    };
    const click = (e) => {
      if (!still) ripples.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 });
    };
    const onResize = () => {
      resize();
      start();
    };

    resize();
    start();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="orb absolute -left-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-sky-400/20 blur-3xl [animation-delay:-6s]" />
        <div className="orb absolute bottom-[-12rem] left-1/2 h-[34rem] w-[34rem] rounded-full bg-violet-500/15 blur-3xl [animation-delay:-12s]" />
      </div>
      <canvas
        ref={ref}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      />
    </>
  );
}
