"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Tombol "Pasang aplikasi". Memakai prompt bawaan browser bila ada, selain itu menampilkan petunjuk manual. */
export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) { setInstalled(true); return; }
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;

  async function install() {
    if (!prompt) { setHint((v) => !v); return; }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <>
      <button type="button" className="nav-install" onClick={install} aria-expanded={prompt ? undefined : hint}>
        <Download size={20} aria-hidden="true" />Pasang aplikasi
      </button>
      {hint && !prompt && <p className="install-hint" role="status">Buka menu browser, lalu pilih Tambahkan ke layar utama.</p>}
    </>
  );
}
