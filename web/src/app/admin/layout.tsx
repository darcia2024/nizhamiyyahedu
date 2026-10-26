import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { AdminNav } from "@/components/AdminNav";
import { StarMark } from "@/components/Logo";
import { initials } from "@/lib/format";
import { signOut } from "@/auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin panel", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN"], "/admin");
  async function logout() { "use server"; await signOut({ redirectTo: "/" }); }
  return <div className="admin-app"><aside className="admin-side">
    <Link className="brand" href="/"><span className="brand-mark"><StarMark size={22} stroke="#fff" dot={false} /></span><b>Nizhamiyyah</b></Link>
    <p className="group-label">Ruang pengelola</p><AdminNav />
    <div className="admin-side-end"><Link href="/dashboard">Kembali ke ruang belajar</Link><form action={logout}><button className="btn btn-ghost sm">Keluar</button></form></div>
  </aside><div className="admin-main"><header className="admin-top"><span className="small muted">Nizhamiyyah Edu / Pengelolaan</span><div className="admin-account"><span className="badge ok">Admin</span><span className="avatar">{initials(user.name)}</span><b>{user.name}</b></div></header>
  <main id="isi" className="admin-content">{children}</main></div></div>;
}
