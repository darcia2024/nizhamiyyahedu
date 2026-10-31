"use client";
import { useEffect, useRef } from "react";
import { withBase } from "@/lib/base-path";
import { Search } from "lucide-react";

/** Pencarian katalog di sidebar. Tekan "/" di mana saja untuk fokus. Tanpa JS tetap jalan sebagai form GET. */
export function SidebarSearch({ action = "/kursus" }: { action?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form className="side-search" action={withBase(action)} method="get" role="search">
      <Search size={17} aria-hidden="true" />
      <label htmlFor="side-q" className="sr-only">Cari kursus atau kitab</label>
      <input ref={ref} id="side-q" name="q" type="search" minLength={2} maxLength={80} placeholder="Cari kursus" autoComplete="off" />
      <kbd aria-hidden="true">/</kbd>
    </form>
  );
}
