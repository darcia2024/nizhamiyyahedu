import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PrintButton } from "@/components/manage/PrintButton";
import { StarMark } from "@/components/Logo";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { issueCertificate } from "@/lib/certificates";
import { dateWib, hoursLabel } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Sertifikat penyelesaian", robots: { index: false } };

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/sertifikat/${slug}`);
  const course = await db.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) notFound();

  const issued = await issueCertificate(user, course.id);
  if (!issued.ok) redirect(issued.reason === "not-enrolled" ? `/dashboard/katalog/${slug}` : "/dashboard/sertifikat");
  const c = issued.certificate;
  if (c.revokedAt) redirect("/dashboard/sertifikat");
  const verifyUrl = `${(process.env.APP_URL ?? "https://nizhamiyyahedu.vercel.app").replace(/\/$/, "")}/sertifikat/${c.code}`;

  return (
    <main className="cert-page" id="isi">
      <div className="cert-toolbar no-print">
        <Link href="/dashboard/sertifikat" className="btn btn-ghost sm"><ChevronLeft size={16} aria-hidden="true" /> Kembali</Link>
        <PrintButton />
      </div>

      <article className="cert" aria-label="Sertifikat penyelesaian kursus">
        <header className="cert-brand"><span className="brand-mark"><StarMark size={22} stroke="#fff" dot={false} /></span><b>Nizhamiyyah Edu</b></header>
        <p className="cert-kicker">Sertifikat penyelesaian</p>
        <p className="cert-lead">Diberikan kepada</p>
        <h1 className="cert-name">{c.holderName}</h1>
        <p className="cert-lead">yang telah menyelesaikan seluruh pelajaran kursus</p>
        {c.courseTitleAr && <p className="cert-ar ar" lang="ar" dir="rtl">{c.courseTitleAr}</p>}
        <h2 className="cert-course">{c.courseTitle}</h2>
        <p className="cert-meta">{c.lessonCount} pelajaran{c.totalMin > 0 ? ` · ${hoursLabel(c.totalMin)}` : ""}</p>
        <p className="cert-note">Semoga ilmu yang dipelajari bermanfaat dan diamalkan. Barakallahu fiikum.</p>
        <footer className="cert-foot">
          <div><span>Tanggal selesai</span><b>{dateWib(c.finishedAt)}</b></div>
          <div className="cert-sign"><span className="cert-line" /><b>{c.teacherName ?? "Pengajar"}</b><span>Pengajar</span></div>
          <div><span>Nomor sertifikat</span><b className="num">{c.code}</b></div>
        </footer>
        <p className="cert-verify">Periksa keaslian: {verifyUrl.replace(/^https?:\/\//, "")}</p>
      </article>
      <p className="small muted no-print" style={{ textAlign: "center" }}>Pakai tombol cetak lalu pilih Simpan sebagai PDF. Siapa pun bisa memeriksa keaslian sertifikat lewat alamat di bagian bawahnya. Atur orientasi ke Lanskap dan hilangkan header dan footer browser.</p>
    </main>
  );
}
