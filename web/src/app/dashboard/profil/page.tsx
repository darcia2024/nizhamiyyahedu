import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth-guard";
import { dateWib } from "@/lib/format";
import { ActionForm, Field } from "@/components/ActionForm";
import { saveProfile } from "./actions";

export const metadata = { title: "Profil" };

const ROLE: Record<string, string> = { STUDENT: "User", TEACHER: "Pengajar", ADMIN: "Admin" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profil");
  const wa = user.whatsapp ? "0" + user.whatsapp.replace(/^62/, "") : null;
  const rows: [string, string][] = [
    ["Nama", user.name || "Belum diisi"],
    ["Email", user.email],
    ["Nomor WhatsApp", wa || "Belum diisi"],
    ["Metode masuk", "Google"],
    ["Peran", ROLE[user.role] ?? user.role],
    ["Bergabung", dateWib(user.createdAt)],
  ];
  return (
    <AppShell user={user} active="profil">
      <h1>Profil</h1>
      <section className="card pad">
        <dl style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) 1fr", gap: "14px 24px", margin: 0 }}>
          {rows.map(([k, v]) => (<div key={k} style={{ display: "contents" }}><dt className="muted">{k}</dt><dd style={{ margin: 0, fontWeight: 500, overflowWrap: "anywhere" }}>{v}</dd></div>))}
        </dl>
        <p className="small muted" style={{ marginTop: 18 }}>Nama dan email mengikuti akun Google kamu.</p>
      </section>
      <section className="card pad"><h2>Nomor WhatsApp</h2><ActionForm action={saveProfile}><Field name="whatsapp" label="WhatsApp" defaultValue={wa} hint="Opsional. Digunakan bila ada kendala pembayaran." full/></ActionForm></section>
    </AppShell>
  );
}
