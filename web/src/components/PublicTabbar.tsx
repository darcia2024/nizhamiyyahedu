"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CirclePlay, House, UserRound } from "lucide-react";

const TABS = [
  { href: "/", label: "Beranda", Icon: House, match: (p: string) => p === "/" },
  { href: "/kursus", label: "Katalog", Icon: BookOpen, match: (p: string) => p === "/kursus" },
  { href: "/dashboard/kursus", label: "Belajar", Icon: CirclePlay, match: () => false },
  { href: "/dashboard/menu", label: "Akun", Icon: UserRound, match: (p: string) => p === "/masuk" },
];

/** Tab bar bawah halaman publik di HP. Disembunyikan di halaman detail kelas yang punya bilah beli sendiri. */
export function PublicTabbar() {
  const path = usePathname();
  if (/^\/kursus\/[^/]+/.test(path)) return null;
  return (
    <>
      <div className="pwa-tabbar-space" aria-hidden="true" />
      <nav className="pwa-tabbar" aria-label="Menu bawah">
        {TABS.map(({ href, label, Icon, match }) => (
          <Link key={href} href={href} aria-current={match(path) ? "page" : undefined}>
            <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
