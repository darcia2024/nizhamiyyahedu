import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicChrome";
import { Markdown } from "@/components/Markdown";
import { LEGAL_SLUGS, LEGAL_TITLE, getContent, getLegal, type LegalSlug } from "@/lib/content";
import { dateWib } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return LEGAL_SLUGS.map((legal) => ({ legal }));
}

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await params;
  return { title: LEGAL_TITLE[legal as LegalSlug] ?? "Halaman", alternates: { canonical: `/${legal}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  if (!LEGAL_SLUGS.includes(legal as LegalSlug)) notFound();
  const slug = legal as LegalSlug;

  if (slug === "kontak") {
    const c = await getContent("contact.main");
    return (
      <PublicShell>
        <div className="gutter"><article className="doc">
          <h1>Kontak</h1>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px 24px", marginTop: 24 }}>
            <dt className="muted">WhatsApp admin</dt><dd style={{ margin: 0, fontWeight: 600 }}>{c.whatsapp}</dd>
            <dt className="muted">Email</dt><dd style={{ margin: 0, fontWeight: 600 }}>{c.email}</dd>
            <dt className="muted">Jam layanan</dt><dd style={{ margin: 0 }}>{c.hours}</dd>
            {c.address && <><dt className="muted">Alamat</dt><dd style={{ margin: 0 }}>{c.address}</dd></>}
          </dl>
        </article></div>
      </PublicShell>
    );
  }

  const doc = await getLegal(slug);
  return (
    <PublicShell>
      <div className="gutter"><article className="doc">
        <h1>{doc.title}</h1>
        <p className="small muted" style={{ margin: "8px 0 24px" }}>
          {doc.updatedAt ? `Terakhir diperbarui ${dateWib(doc.updatedAt)} · Versi ${doc.version}` : "Draf awal, belum diterbitkan"}
        </p>
        <Markdown source={doc.bodyMd} />
      </article></div>
    </PublicShell>
  );
}
