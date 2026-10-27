import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, PlayCircle } from "lucide-react";
import { PublicShell } from "@/components/PublicChrome";
import { Markdown } from "@/components/Markdown";
import { StarMark } from "@/components/Logo";
import { BuyPanel, type BuyState } from "./BuyPanel";
import { db } from "@/lib/db";
import { getCurrentUser, canManageCourse } from "@/lib/auth-guard";
import { getCourseBySlug } from "@/lib/queries";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL, type Field, type Level } from "@/lib/constants";
import { dateTimeWib, hoursLabel, initials, rupiah } from "@/lib/format";
import { getContent } from "@/lib/content";
import { TrackCourseView } from "@/components/TrackCourseView";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lanjut?: string; pratinjau?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCourseBySlug(slug);
  if (!c || c.status !== "PUBLISHED" || c.archivedAt) return { title: "Kursus tidak ditemukan", robots: { index: false } };
  return {
    title: c.title,
    description: c.description.slice(0, 160) || `Kursus ${c.title} di Nizhamiyyah Edu.`,
    alternates: { canonical: `/kursus/${c.slug}` },
    openGraph: { title: c.title, description: c.description.slice(0, 160), type: "website" },
  };
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const manager = user ? await canManageCourse(user, course.id) : false;
  const visible = course.status === "PUBLISHED" && !course.archivedAt;
  if (!visible && !(manager && sp.pratinjau === "1")) notFound();

  const field = course.field as Field;
  const level = course.level as Level;
  const tone = FIELD_TONE[field];
  const totalMin = course.lessons.reduce((a, l) => a + (l.durationMin ?? 0), 0);
  const isFree = course.priceRupiah === 0;
  const contact = await getContent("contact.main");

  let state: BuyState;
  const loginHref = `/masuk?callbackUrl=${encodeURIComponent(`/kursus/${course.slug}?lanjut=1`)}`;
  if (!user) state = { kind: "guest", loginHref };
  else if (manager) {
    state = {
      kind: "manage",
      manageHref: user.role === "ADMIN" ? `/admin/kursus/${course.id}` : `/dashboard/kelola/${course.id}`,
      previewHref: `/dashboard/kursus/${course.slug}`,
    };
  } else {
    const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
    if (enr?.status === "ACTIVE") state = { kind: "enrolled", href: `/dashboard/kursus/${course.slug}` };
    else if (isFree) state = { kind: "free" };
    else {
      const pending = await db.order.findFirst({
        where: { userId: user.id, courseId: course.id, status: "PENDING", expiresAt: { gt: new Date() } },
      });
      state = pending?.payUrl ? { kind: "pending", payUrl: pending.payUrl, until: dateTimeWib(pending.expiresAt) } : { kind: "paid" };
    }
  }

  const facts = [
    `${course.lessons.length} pelajaran${totalMin ? ` · ${hoursLabel(totalMin)}` : ""}`,
    "Teks Arab kitab + terjemah per kalimat",
    "Catatan dan video dari pengajar",
    ...(isFree ? [] : ["Akses selamanya"]),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "Organization", name: "Nizhamiyyah Edu" },
    ...(isFree ? {} : { offers: { "@type": "Offer", price: course.priceRupiah, priceCurrency: "IDR" } }),
  };

  return (
    <PublicShell>
      {visible&&<TrackCourseView courseId={course.id}/>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="gutter">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Jejak halaman">
            <Link href="/kursus">Katalog</Link> › <Link href={`/kursus?bidang=${field}`}>{FIELD_LABEL[field]}</Link> › <span aria-current="page">{course.title}</span>
          </nav>
          {!visible && <div className="preview-banner" style={{ marginTop: 12 }}>Pratinjau: kursus ini belum tayang ke publik.</div>}

          <div className="detail">
            <div style={{ minWidth: 0 }}>
              <header className={`detail-hero c-${tone}`}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
                  <span className={`tag f-${tone}`}>{FIELD_LABEL[field]}</span>
                  <span className="tag plain">{LEVEL_LABEL[level]}</span>
                </div>
                {course.titleAr && <p className="ar" lang="ar" dir="rtl" style={{ position: "relative" }}>{course.titleAr}</p>}
                <h1 style={{ position: "relative" }}>{course.title}</h1>
                <p className="meta" style={{ position: "relative" }}>
                  {course.teacher?.displayName ?? "Pengajar"} · {course.lessons.length} pelajaran{totalMin ? ` · ${hoursLabel(totalMin)}` : ""}
                </p>
              </header>

              <nav className="anchor-nav" aria-label="Lompat ke bagian">
                <a className="chip" href="#tentang">Tentang</a>
                <a className="chip" href="#silabus">Silabus</a>
                <a className="chip" href="#pengajar">Pengajar</a>
                <a className="chip" href="#bantuan">Bantuan</a>
              </nav>

              <section className="block" id="tentang" aria-labelledby="tentang-h">
                <h2 id="tentang-h">Tentang kursus</h2>
                {course.description ? <Markdown source={course.description} /> : <p className="muted">Deskripsi kursus akan segera ditambahkan.</p>}
              </section>

              <section className="block" id="silabus" aria-labelledby="silabus-h">
                <h2 id="silabus-h">Silabus · {course.lessons.length} pelajaran</h2>
                {course.lessons.length ? (
                  <ol className="syl-list">
                    {course.lessons.map((l) => (
                      <li key={l.id}>
                        <span className="no num">{l.position}</span>
                        <span className="tt">{l.title}</span>
                        {l.isFreePreview ? (
                          <Link className="badge ok" href={`/kursus/${course.slug}/pratinjau`}><PlayCircle size={14} aria-hidden="true" /> Pratinjau gratis</Link>
                        ) : (
                          <Lock size={14} aria-label="Terkunci" style={{ color: "var(--muted-ui)" }} />
                        )}
                        {l.durationMin ? <span className="dur num">{l.durationMin} mnt</span> : null}
                      </li>
                    ))}
                  </ol>
                ) : <p className="muted">Pelajaran sedang disiapkan.</p>}
              </section>

              <section className="block" id="pengajar" aria-labelledby="pengajar-h">
                <h2 id="pengajar-h">Pengajar</h2>
                {course.teacher ? (
                  <div className="teacher" style={{ border: 0, padding: 0 }}>
                    <div className="av" aria-hidden="true">{initials(course.teacher.displayName)}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <h3>{course.teacher.displayName}</h3>
                      {course.teacher.alumni && <p className="small muted">{course.teacher.alumni}</p>}
                      {course.teacher.sanad && <p className="small">{course.teacher.sanad}</p>}
                      <p className="small">{course.teacher.bio}</p>
                    </div>
                  </div>
                ) : <p className="muted">Profil pengajar akan segera ditambahkan.</p>}
              </section>

              <section className="block" id="bantuan" aria-labelledby="bantuan-h">
                <h2 id="bantuan-h">Pertanyaan umum</h2>
                <div className="faq" style={{ maxWidth: "none" }}>
                  <details><summary>Bagaimana cara mulai belajar?<span className="plus" aria-hidden="true">+</span></summary><p>{isFree ? "Klik Daftar gratis, lalu masuk dengan akun Google. Kelas langsung terbuka." : "Klik Daftar dan bayar, masuk dengan Google, isi nomor WhatsApp, lalu bayar lewat Mayar. Kelas terbuka otomatis setelah lunas."}</p></details>
                  <details><summary>Bagaimana jika ada kendala?<span className="plus" aria-hidden="true">+</span></summary><p>Hubungi admin lewat WhatsApp {contact.whatsapp}. Ketentuan pengembalian dana ada di <Link href="/refund">Kebijakan refund</Link>.</p></details>
                </div>
              </section>
            </div>

            <BuyPanel
              courseId={course.id}
              title={course.title}
              titleAr={course.titleAr}
              priceLabel={rupiah(course.priceRupiah)}
              priceNumber={course.priceRupiah}
              isFree={isFree}
              facts={facts}
              state={state}
              autoOpen={sp.lanjut === "1"}
              whatsappDefault={user?.whatsapp ? "0" + user.whatsapp.replace(/^62/, "") : ""}
            />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
