"use client";
import { useEffect } from "react";
import { RotateCw } from "lucide-react";

/** Coba lagi manual, dan otomatis memuat ulang begitu HP kembali online. */
export function RetryButton() {
  useEffect(() => {
    const back = () => window.location.reload();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);
  return (
    <button type="button" className="btn btn-primary offline-retry" onClick={() => window.location.reload()}>
      <RotateCw size={17} aria-hidden="true" /> Coba lagi
    </button>
  );
}
