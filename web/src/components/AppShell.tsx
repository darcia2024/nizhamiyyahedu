import Link from "next/link";
import { BookOpen, CirclePlay, CreditCard, LayoutGrid, LogOut, Pencil, PencilRuler, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { StarMark } from "@/components/Logo";
import { InstallButton } from "@/components/InstallButton";
import { signOut } from "@/auth";
import type { CurrentUser } from "@/lib/auth-guard";
import { firstName, initials } from "@/lib/format";

export type NavKey = "dashboard" | "kursus" | "pembayaran" | "profil" | "kelola" | "admin";

const ROLE_LABEL = { STUDENT: "Siswa", TEACHER: "Pengajar", ADMIN: "Admin" } as const;

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
  const icon = { size: 20, strokeWidth: 1.8, "aria-hidden": true } as const;
  const items: { key: NavKey | null; href: string; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", href: "/dashboard", label: "Ringkasan", icon: <LayoutGrid {...icon} /> },
    { key: null, href: "/kursus", label: "Katalog program", icon: <BookOpen {...icon} /> },
    { key: "kursus", href: "/dashboard/kursus", label: "Ruang belajar", icon: <CirclePlay {...icon} /> },
    { key: "pembayaran", href: "/dashboard/pembayaran", label: "Transaksi", icon: <CreditCard {...icon} /> },
  ];
  if (user.role === "TEACHER" || user.role === "ADMIN") items.push({ key: "kelola", href: "/dashboard/kelola", label: "Kelola kursus", icon: <PencilRuler {...icon} /> });
  if (user.role === "ADMIN") items.push({ key: "admin", href: "/admin", label: "Panel admin", icon: <ShieldCheck {...icon} /> });

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

          <div className="profile-card group">
            <span className="profile-av" aria-hidden="true">
              {user.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.image} alt="" width={52} height={52} referrerPolicy="no-referrer" />
                : initials(user.name)}
            </span>
            <span className="profile-info"><b>{user.name ?? "Pengguna"}</b><small>{ROLE_LABEL[user.role]}</small></span>
            <Link className="profile-edit" href="/dashboard/profil" aria-label="Ubah profil"><Pencil size={17} aria-hidden="true" /></Link>
          </div>

          <nav className="group nav" aria-label="Menu utama">
            <span className="group-label">Menu utama</span>
            {items.map((i) => (
              <Link key={i.href} href={i.href} aria-current={i.key && active === i.key ? "page" : undefined}>{i.icon}{i.label}</Link>
            ))}
          </nav>

          <nav className="group nav" aria-label="Akun">
            <span className="group-label">Akun</span>
            <Link href="/dashboard/profil" aria-current={active === "profil" ? "page" : undefined}><Settings2 {...icon} />Pengaturan</Link>
            <InstallButton />
          </nav>

          <form action={logout} className="group nav side-foot">
            <button type="submit"><LogOut {...icon} />Keluar</button>
          </form>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="grow" />
            <div className="who">
              <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
              <span className="name" style={{ fontWeight: 500 }}>{firstName(user.name)}</span>
            </div>
          </div>
          <div id="isi" style={{ display: "contents" }}>{children}</div>
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