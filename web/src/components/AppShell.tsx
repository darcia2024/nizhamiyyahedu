import Link from "next/link";
import { Bell, BookOpen, CreditCard, LayoutDashboard, LogOut, Search, ShieldCheck, UserRound, PencilRuler } from "lucide-react";
import { StarMark } from "@/components/Logo";
import { signOut } from "@/auth";
import type { CurrentUser } from "@/lib/auth-guard";
import { getUserProgress } from "@/lib/progress";
import { FIELD_TONE } from "@/lib/constants";
import { firstName, initials } from "@/lib/format";

export type NavKey = "dashboard" | "kursus" | "pembayaran" | "profil" | "kelola" | "admin";

export async function AppShell({
  user,
  active,
  activeCourse,
  children,
}: {
  user: CurrentUser;
  active: NavKey;
  activeCourse?: string;
  children: React.ReactNode;
}) {
  const progress = await getUserProgress(user.id);
  const mine = progress.slice(0, 3);

  const items: { key: NavKey; href: string; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} aria-hidden="true" /> },
    { key: "kursus", href: "/dashboard/kursus", label: "Kursus saya", icon: <BookOpen size={18} aria-hidden="true" /> },
    { key: "pembayaran", href: "/dashboard/pembayaran", label: "Pembayaran", icon: <CreditCard size={18} aria-hidden="true" /> },
    { key: "profil", href: "/dashboard/profil", label: "Profil", icon: <UserRound size={18} aria-hidden="true" /> },
  ];
  if (user.role === "TEACHER" || user.role === "ADMIN") items.push({ key: "kelola", href: "/dashboard/kelola", label: "Kelola kursus", icon: <PencilRuler size={18} aria-hidden="true" /> });
  if (user.role === "ADMIN") items.push({ key: "admin", href: "/admin", label: "Admin panel", icon: <ShieldCheck size={18} aria-hidden="true" /> });

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="app">
      <div className="shell">
        <aside className="side">
          <Link href="/" className="brand" aria-label="Ke beranda">
            <span className="brand-mark"><StarMark size={20} stroke="#fff" dot={false} /></span>
            <b>Nizhamiyyah</b>
          </Link>
          <nav className="group nav" aria-label="Menu utama">
            <span className="group-label">Menu</span>
            {items.map((i) => (
              <Link key={i.key} href={i.href} aria-current={active === i.key ? "page" : undefined}>{i.icon}{i.label}</Link>
            ))}
            <Link href="/kursus"><Search size={18} aria-hidden="true" />Katalog</Link>
          </nav>
          {mine.length > 0 && (
            <div className="group">
              <span className="group-label">Kursus aktif</span>
              {mine.map((c) => (
                <Link key={c.courseId} className={`mini${activeCourse === c.slug ? " on" : ""}`} href={`/dashboard/kursus/${c.slug}`}>
                  <span className={`letter f-${FIELD_TONE[c.field]}`} aria-hidden="true">{(c.titleAr ?? c.title).trim()[0]}</span>
                  <span><b>{c.title}</b><small>{c.done}/{c.total} pelajaran</small></span>
                </Link>
              ))}
            </div>
          )}
          <form action={logout} className="group nav side-foot">
            <span className="group-label">Akun</span>
            <button type="submit" className="danger"><LogOut size={18} aria-hidden="true" />Keluar</button>
          </form>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="grow" />
            <div className="who">
              {(user.role === "ADMIN" || user.role === "TEACHER") && <Link className="btn btn-ghost sm" href={user.role === "ADMIN" ? "/admin" : "/dashboard/kelola"}>{user.role === "ADMIN" ? "Admin panel" : "Kelola kursus"}</Link>}
              <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
              <span className="name" style={{ fontWeight: 500 }}>{firstName(user.name)}</span>
            </div>
          </div>
          <div id="isi" style={{ display: "contents" }}>{children}</div>
        </div>
      </div>

      <nav className="tabbar" aria-label="Menu bawah">
        <Link href="/dashboard" aria-current={active === "dashboard" ? "page" : undefined}><LayoutDashboard size={20} aria-hidden="true" />Belajar</Link>
        <Link href="/dashboard/kursus" aria-current={active === "kursus" ? "page" : undefined}><BookOpen size={20} aria-hidden="true" />Kursus</Link>
        <Link href="/dashboard/pembayaran" aria-current={active === "pembayaran" ? "page" : undefined}><CreditCard size={20} aria-hidden="true" />Bayar</Link>
        <Link href="/dashboard/profil" aria-current={active === "profil" ? "page" : undefined}><UserRound size={20} aria-hidden="true" />Profil</Link>
      </nav>
    </div>
  );
}
