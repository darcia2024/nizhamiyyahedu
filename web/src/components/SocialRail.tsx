"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Deretan poster yang bergeser sendiri pelan-pelan ke kanan, lalu kembali ke awal.
 * Berhenti saat disentuh, disorot, difokus, atau digeser tangan, dan saat tidak terlihat di layar.
 * Tidak bergerak sama sekali bila perangkat meminta gerak dikurangi.
 */
export function SocialRail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pos = el.scrollLeft;
    let visible = false;
    let holdUntil = 0; // jeda setelah pengguna berinteraksi, atau di ujung deretan
    let raf = 0;

    const hold = (ms: number) => { holdUntil = performance.now() + ms; };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now < holdUntil || document.hidden) { pos = el.scrollLeft; return; }
      // Digeser tangan (roda, sentuh, scrollbar): ikuti posisi baru dan beri jeda.
      if (Math.abs(el.scrollLeft - pos) > 2) { pos = el.scrollLeft; hold(4000); return; }
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (pos >= max - 1) {
        hold(2600);
        el.scrollTo({ left: 0, behavior: "smooth" });
        pos = 0;
        hold(3400);
        return;
      }
      pos = Math.min(max, pos + 0.45);
      el.scrollLeft = pos;
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.25 });
    io.observe(el);
    const pause = () => hold(6000);
    const events = ["pointerenter", "pointerdown", "touchstart", "focusin", "wheel"] as const;
    events.forEach((ev) => el.addEventListener(ev, pause, { passive: true }));
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      events.forEach((ev) => el.removeEventListener(ev, pause));
    };
  }, []);

  return <ul ref={ref} className="social-grid" aria-label={label}>{children}</ul>;
}
