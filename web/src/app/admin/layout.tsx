import Link from "next/link";
import "@/styles/admin-overview.css";
import { withBase } from "@/lib/base-path";
import { requireRole } from "@/lib/auth-guard";
import { AdminNav } from "@/components/AdminNav";
import { AdminTabbar } from "@/components/AdminTabbar";
import { BackButton } from "@/components/BackButton";
import { StarMark } from "@/components/Logo";
import { initials } from "@/lib/format";
import { signOut } from "@/auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Superadmin", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN"], "/admin");
  async function logout() { "use server"; await signOut({ redirectTo: withBase("/") }); }
  return <div className="admin-app"><aside className="admin-side">
    <Link className="brand" href="/"><span className="brand-mark"><StarMark size={22} stroke="#fff" dot={false} /></span><b>Nizhamiyyah</b></Link>
    <p className="group-label">Ruang superadmin</p><AdminNav />
    <div className="admin-side-end"><Link href="/" target="_blank" rel="noopener noreferrer">Lihat website ↗</Link><Link href="/dashboard/profil">Pengaturan akun</Link><form action={logout}><button className="btn btn-ghost sm">Keluar</button></form></div>
  </aside><div className="admin-main"><header className="admin-top"><BackButton /><span className="small muted">Nizhamiyyah Edu / Pengelolaan</span><div className="admin-account"><span className="badge ok">Superadmin</span><span className="avatar">{initials(user.name)}</span><b>{user.name}</b></div></header>
  <main id="isi" className="admin-content">{children}</main></div><AdminTabbar /></div>;
}
