import Link from "next/link";
import { redirect } from "next/navigation";
import { withBase } from "@/lib/base-path";
import { Award, BookOpen, CreditCard, LifeBuoy, LineChart, LogOut, PencilRuler, Settings2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InstallButton } from "@/components/InstallButton";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth-guard";

export const metadata = { title: "Menu" };

/** Menu lengkap untuk layar kecil, karena sidebar disembunyikan di HP dan tab bar hanya memuat empat pintasan. */
export default async function MenuPage() {
  const user = await requireUser("/dashboard/menu");
  if (user.role === "ADMIN") redirect("/admin");
  const icon = { size: 20, strokeWidth: 1.8, "aria-hidden": true } as const;
  const links = [
    { href: "/dashboard/progres", label: "Progres", icon: <LineChart {...icon} /> },
    { href: "/dashboard/sertifikat", label: "Sertifikat", icon: <Award {...icon} /> },
    { href: "/dashboard/pembayaran", label: "Transaksi", icon: <CreditCard {...icon} /> },
    { href: "/dashboard/katalog", label: "Katalog kelas", icon: <BookOpen {...icon} /> },
    { href: "/dashboard/profil", label: "Pengaturan", icon: <Settings2 {...icon} /> },
    { href: "/kontak", label: "Bantuan", icon: <LifeBuoy {...icon} /> },
  ];
  if (user.role === "TEACHER") links.push({ href: "/dashboard/kelola", label: "Kelola kursus", icon: <PencilRuler {...icon} /> });

  async function logout() {
    "use server";
    await signOut({ redirectTo: withBase("/") });
  }

  return (
    <AppShell user={user} active="menu">
      <div className="page-hd"><h1>Menu</h1></div>
      <nav className="card menu-list nav" aria-label="Menu lengkap">
        {links.map((l) => <Link key={l.href} href={l.href}>{l.icon}{l.label}</Link>)}
        <InstallButton />
      </nav>
      <form action={logout}><button type="submit" className="btn btn-ghost block"><LogOut size={18} aria-hidden="true" /> Keluar</button></form>
    </AppShell>
  );
}
