import { useEffect, useRef } from "react";

/*
 * The desk under the pad. A carbon-ruled ground that answers the pointer the way carbon paper answers a pen:
 *  - the ruling bows toward the pointer and darkens around it, as if pressed
 *  - moving leaves a short carbon trace that fades within a second and a half
 *  - a click presses a small ring into the sheet
 * It sits behind the opaque sheets, so it shows in the margins and never under text people read.
 * It only animates while something is changing, and under reduced motion it is a still ruling.
 */
const GAP = 28; // distance between ruled lines
const STEP = 10; // horizontal resolution of a bent line
const SIGMA = 95; // reach of the pointer's pressure
const TRACE_MS = 1400;
const INK = "29, 43, 107"; // carbon blue

export default function Background() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pen = { x: 0, y: 0, sx: 0, sy: 0, on: false, press: 0 };
    let trace = [];
    let rings = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pull = (x, y) => {
      if (!pen.press) return 0;
      const dx = x - pen.sx;
      const dy = y - pen.sy;
      return pen.press * Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let y0 = GAP; y0 < h; y0 += GAP) {
        const near = pen.press > 0.01 && Math.abs(y0 - pen.sy) < SIGMA * 3;
        if (!near) {
          ctx.strokeStyle = `rgba(${INK}, 0.07)`;
          ctx.beginPath();
          ctx.moveTo(0, y0 + 0.5);
          ctx.lineTo(w, y0 + 0.5);
          ctx.stroke();
          continue;
        }
        // bent line: each short segment drawn with its own depth of ink
        let px = 0;
        let py = y0;
        for (let x = STEP; x <= w + STEP; x += STEP) {
          const f = pull(x, y0);
          const y = y0 + (pen.sy - y0) * 0.22 * f;
          ctx.strokeStyle = `rgba(${INK}, ${0.07 + 0.3 * f})`;
          ctx.beginPath();
          ctx.moveTo(px, py + 0.5);
          ctx.lineTo(x, y + 0.5);
          ctx.stroke();
          px = x;
          py = y;
        }
      }

      // the carbon trace, oldest first so the fresh end sits on top
      ctx.lineCap = "round";
      for (let i = 1; i < trace.length; i++) {
        const a = trace[i - 1];
        const b = trace[i];
        const life = 1 - (now - b.t) / TRACE_MS;
        if (life <= 0) continue;
        ctx.strokeStyle = `rgba(${INK}, ${0.34 * life})`;
        ctx.lineWidth = 0.6 + 1.2 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (const r of rings) {
        const k = Math.min((now - r.t) / 700, 1);
        const ease = 1 - (1 - k) ** 3;
        ctx.strokeStyle = `rgba(${INK}, ${0.4 * (1 - k)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + 30 * ease, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const frame = (now) => {
      raf = 0;
      // the pressure point trails the pointer slightly, so the ruling eases rather than snaps
      pen.sx += (pen.x - pen.sx) * 0.18;
      pen.sy += (pen.y - pen.sy) * 0.18;
      pen.press += ((pen.on ? 1 : 0) - pen.press) * 0.12;
      trace = trace.filter((p) => now - p.t < TRACE_MS);
      rings = rings.filter((r) => now - r.t < 700);
      draw(now);
      const settling =
        Math.abs(pen.x - pen.sx) > 0.3 ||
        Math.abs(pen.y - pen.sy) > 0.3 ||
        Math.abs((pen.on ? 1 : 0) - pen.press) > 0.005;
      if (settling || trace.length || rings.length) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf && !still && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const move = (e) => {
      if (still || e.pointerType === "touch") return;
      if (!pen.on) {
        pen.sx = e.clientX;
        pen.sy = e.clientY;
      }
      pen.on = true;
      pen.x = e.clientX;
      pen.y = e.clientY;
      trace.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trace.length > 80) trace.shift();
      wake();
    };
    const leave = () => {
      pen.on = false;
      wake();
    };
    const press = (e) => {
      if (still) return;
      rings.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      wake();
    };
    const onResize = () => {
      resize();
      draw(performance.now());
    };
    const onVisible = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else draw(performance.now());
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
