import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldX } from "lucide-react";
import { PublicShell } from "@/components/PublicChrome";
import { db } from "@/lib/db";
import { isCertificateCode } from "@/lib/certificates";
import { dateWib, hoursLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Periksa sertifikat", robots: { index: false, follow: false } };

/** Halaman publik untuk memeriksa keaslian sertifikat dari nomornya (tanpa login). Hanya menampilkan data yang tercetak di sertifikat. */
export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).trim().toUpperCase();
  const cert = isCertificateCode(code) ? await db.certificate.findUnique({ where: { code } }) : null;
  const valid = !!cert && !cert.revokedAt;

  return (
    <PublicShell>
      <main className="gutter" style={{ padding: "56px max(16px,4vw) 88px" }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          {valid ? (
            <article className="card" style={{ padding: "28px clamp(20px,4vw,36px)", display: "grid", gap: 14 }} data-testid="cert-valid">
              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#1e715c" }}><BadgeCheck size={22} aria-hidden="true" /> Sertifikat sah</p>
              <h1 style={{ margin: 0 }}>{cert.holderName}</h1>
              <p style={{ margin: 0 }}>telah menyelesaikan seluruh pelajaran kelas <b>{cert.courseTitle}</b>.</p>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "max-content 1fr", gap: "8px 18px", fontSize: 15 }}>
                <dt className="muted">Nomor</dt><dd style={{ margin: 0 }} className="num">{cert.code}</dd>
                <dt className="muted">Selesai</dt><dd style={{ margin: 0 }}>{dateWib(cert.finishedAt)}</dd>
                <dt className="muted">Materi</dt><dd style={{ margin: 0 }}>{cert.lessonCount} pelajaran{cert.totalMin > 0 ? ` · ${hoursLabel(cert.totalMin)}` : ""}</dd>
                {cert.teacherName && <><dt className="muted">Pengajar</dt><dd style={{ margin: 0 }}>{cert.teacherName}</dd></>}
                <dt className="muted">Diterbitkan</dt><dd style={{ margin: 0 }}>Nizhamiyyah Edu, {dateWib(cert.issuedAt)}</dd>
              </dl>
            </article>
          ) : (
            <article className="card" style={{ padding: "28px clamp(20px,4vw,36px)", display: "grid", gap: 12 }} data-testid="cert-invalid">
              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#9b2c2c" }}><ShieldX size={22} aria-hidden="true" /> Sertifikat tidak ditemukan</p>
              <h1 style={{ margin: 0 }}>Nomor ini tidak terdaftar</h1>
              <p className="muted" style={{ margin: 0 }}>Periksa lagi nomor di sertifikat (contoh bentuknya NZ-2026-3F9A12CC). Nomor yang sudah dicabut juga tidak lagi dianggap sah.</p>
              <Link className="btn btn-ghost" href="/">Ke beranda</Link>
            </article>
          )}
        </div>
      </main>
    </PublicShell>
  );
}
