import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { requireUser } from "@/lib/auth-guard";
import { getContent, getLegal } from "@/lib/content";
import { isPlaceholder } from "@/lib/format";

export const metadata = { title: "Bantuan" };
export const dynamic = "force-dynamic";

/** Nomor lokal (08…) menjadi format internasional untuk tautan WhatsApp; kosong bila bukan nomor yang bisa dipakai. */
function waLink(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length < 9) return null;
  return `https://wa.me/${d.startsWith("0") ? `62${d.slice(1)}` : d}`;
}

/** Kontak dan ketentuan di dalam dashboard, supaya pengguna yang sudah login tidak perlu keluar ke halaman publik. */
export default async function HelpPage() {
  const user = await requireUser("/dashboard/bantuan");
  const [contact, syarat, refund, privasi] = await Promise.all([getContent("contact.main"), getLegal("syarat"), getLegal("refund"), getLegal("privasi")]);
  const wa = waLink(contact.whatsapp);

  return (
    <AppShell user={user} active="bantuan">
      <div className="page-hd"><h1>Bantuan</h1></div>

      <section className="card pad" aria-labelledby="kontak-h">
        <h2 id="kontak-h" style={{ marginBottom: 14 }}>Hubungi admin</h2>
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 24px", margin: 0 }}>
          <dt className="muted">WhatsApp admin</dt><dd style={{ margin: 0, fontWeight: 600 }}>{contact.whatsapp}</dd>
          {!isPlaceholder(contact.email) && <><dt className="muted">Email</dt><dd style={{ margin: 0, fontWeight: 600 }}>{contact.email}</dd></>}
          <dt className="muted">Jam layanan</dt><dd style={{ margin: 0 }}>{contact.hours}</dd>
          {contact.address && !isPlaceholder(contact.address) && <><dt className="muted">Alamat</dt><dd style={{ margin: 0 }}>{contact.address}</dd></>}
        </dl>
        {wa && <p style={{ marginTop: 18 }}><a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" /> Chat admin lewat WhatsApp</a></p>}
      </section>

      <section className="card pad" aria-labelledby="aturan-h">
        <h2 id="aturan-h" style={{ marginBottom: 14 }}>Ketentuan</h2>
        <div className="faq" style={{ maxWidth: "none" }}>
          {[syarat, refund, privasi].map((doc) => (
            <details key={doc.title}>
              <summary>{doc.title}<span className="plus" aria-hidden="true">+</span></summary>
              <Markdown source={doc.bodyMd} />
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
