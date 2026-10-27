import Link from "next/link";
import { BookOpen, ChevronsUpDown, CirclePlay, CreditCard, LayoutGrid, LifeBuoy, LogOut, PencilRuler, Search, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { StarMark } from "@/components/Logo";
import { InstallButton } from "@/components/InstallButton";
import { SidebarSearch } from "@/components/SidebarSearch";
import { signOut } from "@/auth";
import type { CurrentUser } from "@/lib/auth-guard";
import { initials } from "@/lib/format";

export type NavKey = "dashboard" | "kursus" | "pembayaran" | "profil" | "kelola" | "admin";

const PAGE_LABEL: Record<NavKey, string> = {
  dashboard: "Ringkasan",
  kursus: "Ruang belajar",
  pembayaran: "Transaksi",
  profil: "Pengaturan",
  kelola: "Kelola kursus",
  admin: "Panel admin",
};

export async function AppShell({
  user,
  active,
  children,
}: {
  user: CurrentUser;
  active: NavKey;
  activeCourse?: string;
  children: React.ReactNode;
}) {
  const icon = { size: 18, strokeWidth: 1.8, "aria-hidden": true } as const;
  const main: { key: NavKey | null; href: string; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", href: "/dashboard", label: "Ringkasan", icon: <LayoutGrid {...icon} /> },
    { key: null, href: "/kursus", label: "Katalog program", icon: <BookOpen {...icon} /> },
    { key: "kursus", href: "/dashboard/kursus", label: "Ruang belajar", icon: <CirclePlay {...icon} /> },
    { key: "pembayaran", href: "/dashboard/pembayaran", label: "Transaksi", icon: <CreditCard {...icon} /> },
  ];
  const manage: typeof main = [];
  if (user.role === "TEACHER" || user.role === "ADMIN") manage.push({ key: "kelola", href: "/dashboard/kelola", label: "Kelola kursus", icon: <PencilRuler {...icon} /> });
  if (user.role === "ADMIN") manage.push({ key: "admin", href: "/admin", label: "Panel admin", icon: <ShieldCheck {...icon} /> });

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const link = (i: (typeof main)[number]) => (
    <Link key={i.href} href={i.href} aria-current={i.key && active === i.key ? "page" : undefined}>{i.icon}{i.label}</Link>
  );

  return (
    <div className="app">
      <div className="shell">
        <aside className="side">
          <Link href="/" className="ws" aria-label="Ke beranda Nizhamiyyah Edu">
            <span className="brand-mark"><StarMark size={22} stroke="#fff" dot={false} /></span>
            <span className="ws-info"><b>Nizhamiyyah</b><small>Ruang belajar</small></span>
            <ChevronsUpDown size={16} aria-hidden="true" />
          </Link>

          <SidebarSearch />

          <nav className="group nav" aria-label="Menu utama">
            <span className="group-label">Belajar</span>
            {main.map(link)}
          </nav>

          {manage.length > 0 && (
            <nav className="group nav" aria-label="Pengelola">
              <span className="group-label">Pengelola</span>
              {manage.map(link)}
            </nav>
          )}

          <div className="side-foot">
            <nav className="group nav" aria-label="Akun">
              <Link href="/kontak"><LifeBuoy {...icon} />Bantuan</Link>
              <Link href="/dashboard/profil" aria-current={active === "profil" ? "page" : undefined}><Settings2 {...icon} />Pengaturan</Link>
              <InstallButton />
            </nav>
            <form action={logout} className="user-card">
              <span className="profile-av" aria-hidden="true">
                {user.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.image} alt="" width={36} height={36} referrerPolicy="no-referrer" />
                  : initials(user.name)}
              </span>
              <span className="profile-info"><b>{user.name ?? "Pengguna"}</b><small>{user.email}</small></span>
              <button type="submit" className="user-out" aria-label="Keluar"><LogOut size={17} aria-hidden="true" /></button>
            </form>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <p className="crumb">Dashboard <span aria-hidden="true">/</span> <b>{PAGE_LABEL[active]}</b></p>
            <div className="grow" />
            <Link className="top-btn" href="/kursus"><Search size={16} aria-hidden="true" />Jelajahi katalog</Link>
          </div>
          <div id="isi" className="panel">{children}</div>
        </div>
      </div>

      <nav className="tabbar" aria-label="Menu bawah">
        <Link href="/dashboard" aria-current={active === "dashboard" ? "page" : undefined}><LayoutGrid size={20} aria-hidden="true" />Belajar</Link>
        <Link href="/dashboard/kursus" aria-current={active === "kursus" ? "page" : undefined}><CirclePlay size={20} aria-hidden="true" />Kursus</Link>
        <Link href="/dashboard/pembayaran" aria-current={active === "pembayaran" ? "page" : undefined}><CreditCard size={20} aria-hidden="true" />Bayar</Link>
        <Link href="/dashboard/profil" aria-current={active === "profil" ? "page" : undefined}><UserRound size={20} aria-hidden="true" />Profil</Link>
      </nav>
    </div>
  );
}
