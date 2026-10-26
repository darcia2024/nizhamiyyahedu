"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, GraduationCap, CreditCard, FileText, History, CircleHelp } from "lucide-react";

const items = [
  ["/admin", "Ringkasan", LayoutDashboard], ["/admin/kursus", "Kursus", BookOpen],
  ["/admin/pengajar", "Pengajar", GraduationCap], ["/admin/pengguna", "User", Users],
  ["/admin/pembayaran", "Pembayaran", CreditCard], ["/admin/konten", "Isi website", FileText],
  ["/admin/log", "Catatan aktivitas", History], ["/admin/bantuan", "Bantuan", CircleHelp],
] as const;
export function AdminNav() {
  const path = usePathname();
  return <nav className="admin-nav" aria-label="Menu admin">{items.map(([href, label, Icon]) =>
    <Link key={href} href={href} aria-current={(href === "/admin" ? path === href : path.startsWith(href)) ? "page" : undefined}><Icon size={18} aria-hidden="true" />{label}</Link>
  )}</nav>;
}
