"use client";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Halaman utama tiap tab: tidak perlu tombol kembali.
const ROOTS = ["/", "/kursus", "/dashboard", "/dashboard/kursus", "/dashboard/catatan", "/dashboard/menu", "/admin", "/masuk"];

/**
 * Tombol kembali untuk mode aplikasi. Di iPhone, PWA tidak punya tombol back sama sekali,
 * jadi tombol ini hanya tampil saat aplikasi dibuka dari layar utama (lihat pwa.css).
 */
export function BackButton({ className = "" }: { className?: string }) {
  const path = usePathname();
  const router = useRouter();
  if (ROOTS.includes(path)) return null;
  const parent = path.split("/").slice(0, -1).join("/") || "/";
  return (
    <button
      type="button"
      className={`pwa-back ${className}`}
      aria-label="Kembali"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(parent))}
    >
      <ChevronLeft size={24} aria-hidden="true" />
    </button>
  );
}
