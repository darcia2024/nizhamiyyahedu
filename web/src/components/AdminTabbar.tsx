"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CreditCard, FileText, LayoutDashboard, Users } from "lucide-react";

const TABS = [
  ["/admin", "Ringkasan", LayoutDashboard], ["/admin/kursus", "Kursus", BookOpen], ["/admin/pengguna", "Pengguna", Users],
  ["/admin/pembayaran", "Bayar", CreditCard], ["/admin/konten", "Konten", FileText],
] as const;

/** Tab bar bawah panel superadmin di HP. Menu lain tetap ada di deretan menu atas. */
export function AdminTabbar() {
  const path = usePathname();
  return (
    <nav className="pwa-tabbar admin-tabbar" aria-label="Menu admin bawah">
      {TABS.map(([href, label, Icon]) => (
        <Link key={href} href={href} aria-current={(href === "/admin" ? path === href : path.startsWith(href)) ? "page" : undefined}>
          <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
