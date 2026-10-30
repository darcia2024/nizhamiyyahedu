"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, PlusSquare, Share, WifiOff, X } from "lucide-react";
import { withBase } from "@/lib/base-path";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "nz-install-dismissed";
const VISITS_KEY = "nz-visits";
const DISMISS_DAYS = 14;
const NO_SHEET = ["/masuk", "/offline", "/dev", "/admin"];

const store = {
  get(k: string) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { window.localStorage.setItem(k, v); } catch { /* mode privat */ } },
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Lapisan "aplikasi" untuk HP dan PWA:
 * service worker, kabar versi baru, kabar offline, getar halus di tab bar, dan lembar ajakan pasang aplikasi.
 */
export function PwaProvider() {
  const path = usePathname();
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [sheet, setSheet] = useState<null | "android" | "ios">(null);
  const prompt = useRef<InstallPrompt | null>(null);
  const reloading = useRef(false);

  // Tandai mode aplikasi supaya CSS bisa menyesuaikan (tombol kembali, tanpa pantulan scroll, dll).
  useEffect(() => {
    if (isStandalone()) document.documentElement.dataset.standalone = "1";
  }, []);

  // Service worker: hanya di build produksi supaya hot reload saat pengembangan tidak terganggu.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    const watch = (r: ServiceWorkerRegistration) => {
      if (r.waiting && navigator.serviceWorker.controller) setUpdate(r.waiting);
      r.addEventListener("updatefound", () => {
        const next = r.installing;
        next?.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) setUpdate(next);
        });
      });
    };
    navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/"), updateViaCache: "none" })
      .then((r) => { reg = r; watch(r); })
      .catch(() => undefined);
    const onControl = () => { if (reloading.current) window.location.reload(); };
    // Cek versi baru setiap kali aplikasi dibuka lagi dari latar belakang.
    const onVisible = () => { if (document.visibilityState === "visible") reg?.update().catch(() => undefined); };
    navigator.serviceWorker.addEventListener("controllerchange", onControl);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControl);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Kabar offline/online seperti aplikasi native.
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  // Getar halus saat menekan tab bawah (Android; iPhone mengabaikannya).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if ((e.target as Element | null)?.closest(".tabbar a, .pwa-tabbar a")) navigator.vibrate?.(8);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Ajakan pasang: hanya di HP, belum terpasang, tidak baru saja ditolak, dan setelah user cukup lama menjelajah.
  useEffect(() => {
    if (isStandalone() || !window.matchMedia("(pointer: coarse)").matches) return;
    const dismissed = Number(store.get(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissed < DISMISS_DAYS * 864e5) return;
    const visits = Number(store.get(VISITS_KEY) ?? 0) + 1;
    store.set(VISITS_KEY, String(visits));

    let timer: number | undefined;
    const offer = (kind: "android" | "ios") => {
      timer = window.setTimeout(() => setSheet(kind), visits > 1 ? 4000 : 25000);
    };
    const onPrompt = (e: Event) => { e.preventDefault(); prompt.current = e as InstallPrompt; offer("android"); };
    const onInstalled = () => { setSheet(null); prompt.current = null; };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIos()) offer("ios");
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const hideSheet = NO_SHEET.some((p) => path === p || path.startsWith(p + "/"));

  function dismiss() {
    store.set(DISMISS_KEY, String(Date.now()));
    setSheet(null);
  }
  async function install() {
    const p = prompt.current;
    if (!p) return;
    await p.prompt();
    const { outcome } = await p.userChoice;
    prompt.current = null;
    if (outcome === "accepted") setSheet(null); else dismiss();
  }
  function applyUpdate() {
    if (!update) return;
    reloading.current = true;
    update.postMessage("SKIP_WAITING");
  }

  return (
    <>
      <div className="pwa-toasts" aria-live="polite">
        {offline && <p className="pwa-toast"><WifiOff size={16} aria-hidden="true" /> Kamu sedang offline. Halaman yang pernah dibuka tetap bisa dilihat.</p>}
        {update && !offline && (
          <p className="pwa-toast">
            Versi baru aplikasi sudah siap.
            <button type="button" onClick={applyUpdate}>Muat ulang</button>
          </p>
        )}
      </div>
      {sheet && !hideSheet && <InstallSheet kind={sheet} onInstall={install} onClose={dismiss} />}
    </>
  );
}

function InstallSheet({ kind, onInstall, onClose }: { kind: "android" | "ios"; onInstall: () => void; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  // Usap ke bawah untuk menutup, seperti lembar bawaan iOS dan Android.
  const onTouchStart = (e: React.TouchEvent) => { start.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (start.current === null) return;
    setDrag(Math.max(0, e.touches[0].clientY - start.current));
  };
  const onTouchEnd = () => {
    if (drag > 90) onClose(); else setDrag(0);
    start.current = null;
  };

  useEffect(() => { panel.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pwa-sheet-wrap">
      <button type="button" className="pwa-sheet-scrim" aria-label="Tutup" onClick={onClose} tabIndex={-1} />
      <div
        ref={panel}
        className="pwa-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-sheet-title"
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="pwa-grab" aria-hidden="true" />
        <button type="button" className="pwa-sheet-close" aria-label="Tutup" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        <div className="pwa-sheet-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase("/icon-192.png")} alt="" width={56} height={56} />
          <div>
            <h2 id="pwa-sheet-title">Pasang Nizhamiyyah di HP</h2>
            <p>Buka kelas langsung dari layar utama, layar penuh tanpa bilah browser.</p>
          </div>
        </div>
        {kind === "android" ? (
          <div className="pwa-sheet-actions">
            <button type="button" className="btn btn-primary block" onClick={onInstall}><Download size={18} aria-hidden="true" /> Pasang aplikasi</button>
            <button type="button" className="btn btn-ghost block" onClick={onClose}>Nanti saja</button>
          </div>
        ) : (
          <ol className="pwa-steps">
            <li><span>1</span>Ketuk tombol Bagikan <Share size={17} aria-label="ikon Bagikan" /> di bilah Safari</li>
            <li><span>2</span>Pilih <b>Tambah ke Layar Utama</b> <PlusSquare size={17} aria-hidden="true" /></li>
            <li><span>3</span>Ketuk <b>Tambah</b> di pojok kanan atas</li>
          </ol>
        )}
      </div>
    </div>
  );
}
