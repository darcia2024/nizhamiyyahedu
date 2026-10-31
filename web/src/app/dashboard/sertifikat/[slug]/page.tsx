import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PrintButton } from "@/components/manage/PrintButton";
import { StarMark } from "@/components/Logo";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { certificateNo, courseFinished } from "@/lib/learning";
import { dateWib, hoursLabel } from "@/lib/format";
import { FIELD_LABEL, LEVEL_LABEL, type Field, type Level } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Sertifikat penyelesaian", robots: { index: false } };

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/sertifikat/${slug}`);
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      teacher: { select: { displayName: true } },
      lessons: { where: { status: "PUBLISHED" }, select: { id: true, durationMin: true } },
    },
  });
  if (!course) notFound();

  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (enr?.status !== "ACTIVE") redirect(`/dashboard/katalog/${slug}`);

  const done = await db.lessonProgress.findMany({
    where: { userId: user.id, completedAt: { not: null }, lessonId: { in: course.lessons.map((l) => l.id) } },
    select: { completedAt: true },
  });
  if (!courseFinished(course.lessons.length, done.length)) redirect("/dashboard/sertifikat");

  const finishedAt = new Date(Math.max(...done.map((d) => d.completedAt!.getTime())));
  const totalMin = course.lessons.reduce((a, l) => a + (l.durationMin ?? 0), 0);
  const no = certificateNo(user.id, course.id, finishedAt);

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
        <h1 className="cert-name">{user.name ?? user.email}</h1>
        <p className="cert-lead">yang telah menyelesaikan seluruh pelajaran kursus</p>
        {course.titleAr && <p className="cert-ar ar" lang="ar" dir="rtl">{course.titleAr}</p>}
        <h2 className="cert-course">{course.title}</h2>
        <p className="cert-meta">
          {FIELD_LABEL[course.field as Field]} · Jenjang {LEVEL_LABEL[course.level as Level]} · {course.lessons.length} pelajaran{totalMin > 0 ? ` · ${hoursLabel(totalMin)}` : ""}
        </p>
        <p className="cert-note">Semoga ilmu yang dipelajari bermanfaat dan diamalkan. Barakallahu fiikum.</p>
        <footer className="cert-foot">
          <div><span>Tanggal selesai</span><b>{dateWib(finishedAt)}</b></div>
          <div className="cert-sign"><span className="cert-line" /><b>{course.teacher?.displayName ?? "Pengajar"}</b><span>Pengajar</span></div>
          <div><span>Nomor sertifikat</span><b className="num">{no}</b></div>
        </footer>
      </article>
      <p className="small muted no-print" style={{ textAlign: "center" }}>Pakai tombol cetak lalu pilih Simpan sebagai PDF. Atur orientasi ke Lanskap dan hilangkan header dan footer browser.</p>
    </main>
  );
}
