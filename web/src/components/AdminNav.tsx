"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, GraduationCap, CreditCard, FileText, History, CircleHelp, ListChecks, BookMarked, TicketPercent } from "lucide-react";

const items = [
  ["/admin", "Ringkasan", LayoutDashboard], ["/admin/tinjau", "Perlu ditinjau", ListChecks], ["/admin/kursus", "Kursus", BookOpen],
  ["/admin/pengajar", "Pengajar", GraduationCap], ["/admin/pengguna", "Pengguna", Users],
  ["/admin/pembayaran", "Pembayaran", CreditCard], ["/admin/voucher", "Voucher", TicketPercent],["/admin/konten", "Konten website", FileText],
  ["/admin/log", "Aktivitas website", History], ["/admin/bantuan", "Bantuan", CircleHelp], ["/tutorial", "Tutorial", BookMarked],
] as const;
export function AdminNav({ reviewCount = 0 }: { reviewCount?: number }) {
  const path = usePathname();
  return <nav className="admin-nav" aria-label="Menu admin">{items.map(([href, label, Icon]) =>
    <Link key={href} href={href} aria-current={(href === "/admin" ? path === href : path.startsWith(href)) ? "page" : undefined}><Icon size={18} aria-hidden="true" />{label}{href === "/admin/tinjau" && reviewCount > 0 && <span className="badge wait" aria-label={`${reviewCount} menunggu`}>{reviewCount}</span>}</Link>
  )}</nav>;
}
