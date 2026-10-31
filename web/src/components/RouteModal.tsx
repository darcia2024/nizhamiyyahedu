"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import "@/styles/course-sheet.css";

/**
 * Pop-up untuk rute yang dicegat (intercepting route): halaman tampil di atas dashboard tanpa meninggalkannya.
 * Menutup pop-up (tombol, Esc, atau klik di luar) = kembali ke halaman sebelumnya.
 */
export function RouteModal({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    ref.current?.showModal();
    // Halaman di belakang jangan ikut tergulir selama pop-up terbuka.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <dialog
      ref={ref}
      className="route-modal"
      aria-label={label}
      onClose={() => router.back()}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
    >
      <div className="route-modal-body">
        <button type="button" className="route-modal-x" aria-label="Tutup" onClick={() => ref.current?.close()}><X size={20} aria-hidden="true" /></button>
        {children}
      </div>
    </dialog>
  );
}
