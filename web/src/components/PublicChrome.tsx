import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
import { getContent } from "@/lib/content";

const NAV = [
  { href: "/kursus", label: "Katalog" },
  { href: "/#jenjang", label: "Jenjang belajar" },
  { href: "/#pengajar", label: "Pengajar" },
  { href: "/#faq", label: "Tanya jawab" },
];

export function PublicHeader({ landing = false }: { landing?: boolean }) {
  return (
    <>
    <header className={`pub-header gutter${landing ? " landing-header" : ""}`}>
      <div className="wrap">
        <Link href="/" aria-label="Nizhamiyyah Edu, ke beranda"><Logo /></Link>
        <nav className="nav-inline" aria-label="Navigasi utama">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <div className="hdr-right">
          <HeaderAuth />
          <details className="menu-d">
            <summary aria-label="Buka menu"><Menu size={20} aria-hidden="true" /></summary>
            <nav aria-label="Menu">
              {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
    </>
  );
}

export async function PublicFooter() {
  const [contact, copy] = await Promise.all([getContent("contact.main"), getContent("site.copy")]);
  return (
    <footer className="pub-footer gutter">
      <div className="wrap">
        <div className="foot-grid">
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <span className="serif" style={{ fontWeight: 600, fontSize: 22, color: "#fff" }}>Nizhamiyyah Edu</span>
            <p style={{ maxWidth: "32em" }}>{copy.footerDescription}</p>
            <p>WhatsApp admin: <span style={{ color: "#fff" }}>{contact.whatsapp}</span></p>
            <p>Instagram: <a href={`https://www.instagram.com/${copy.instagramHandle}/`} target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>@{copy.instagramHandle}</a></p>
          </div>
          <nav aria-label="Belajar">
            <b>Belajar</b>
            <Link href="/kursus">Katalog kursus</Link>
            <Link href="/#jenjang">Jenjang belajar</Link>
            <Link href="/#pengajar">Pengajar</Link>
            <Link href="/masuk">Masuk</Link>
          </nav>
          <nav aria-label="Informasi">
            <b>Informasi</b>
            <Link href="/privasi">Kebijakan privasi</Link>
            <Link href="/syarat">Syarat dan ketentuan</Link>
            <Link href="/refund">Kebijakan refund</Link>
            <Link href="/kontak">Kontak</Link>
          </nav>
        </div>
        <p className="foot-bottom">© {new Date().getFullYear()} {copy.footerCopyright}</p>
      </div>
    </footer>
  );
}

export function PublicShell({ children, landing = false }: { children: React.ReactNode; landing?: boolean }) {
  return (
    <>
      <PublicHeader landing={landing} />
      <main id="isi" className={landing ? "landing-page" : undefined}>{children}</main>
      <PublicFooter />
    </>
  );
}
