import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, PlayCircle } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { PreviewDialog } from "@/components/PreviewDialog";
import { Thumb } from "@/components/Thumb";
import { TrackCourseView } from "@/components/TrackCourseView";
import { BuyPanel, type BuyState } from "@/app/kursus/[slug]/BuyPanel";
import { db } from "@/lib/db";
import { canManageCourse, getCurrentUser, requireUser } from "@/lib/auth-guard";
import { getCourseBySlug } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL, type Field, type Level } from "@/lib/constants";
import { dateTimeWib, hoursLabel, isPlaceholder, rupiah } from "@/lib/format";
import { getContent } from "@/lib/content";
import { parseBundle, unlockedCourseIds } from "@/lib/bundle";
import { parseVideoUrl, type VideoSource } from "@/lib/video";
import "@/styles/kursus-detail.css";

// "Ust. Afrozul Mukhoiyirin, Lc., Dipl." -> "Ust. Afrozul Mukhoiyirin" untuk paket yang memuat beberapa pengajar.
const shortName = (n: string) => n.split(",")[0].trim();

/**
 * Isi halaman kelas, dipakai di dua tempat:
 * - "public": halaman /kursus/[slug] untuk pengunjung (pratinjau membuka halaman sendiri).
 * - "dashboard": di dalam dashboard (pop-up atau halaman penuh). Semuanya tetap di dashboard: tautan ke katalog dashboard,
 *   pratinjau gratis diputar di pop-up, dan pembayaran lewat pop-up.
 */
export async function CourseDetail({ slug, variant, lanjut = false, managerPreview = false }: {
  slug: string;
  variant: "public" | "dashboard";
  lanjut?: boolean;
  managerPreview?: boolean;
}) {
  const inDash = variant === "dashboard";
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const user = inDash ? await requireUser(`/dashboard/katalog/${slug}`) : await getCurrentUser();
  const manager = user ? await canManageCourse(user, course.id) : false;
  const visible = course.status === "PUBLISHED" && !course.archivedAt;
  if (!visible && !(manager && managerPreview)) notFound();

  const field = course.field as Field;
  const level = course.level as Level;
  // Paket bundling: isi paket menggantikan silabus; jumlah pelajaran dihitung dari kursus isinya.
  const bundleIds = parseBundle(course.bundleCourseIds);
  const bundle = bundleIds.length
    ? (await db.course.findMany({
        where: { id: { in: bundleIds }, archivedAt: null },
        select: { id: true, slug: true, title: true, titleAr: true, coverUrl: true, field: true, priceRupiah: true, status: true, teacher: true, lessons: { where: { status: "PUBLISHED" }, select: { durationMin: true } } },
      })).sort((a, b) => bundleIds.indexOf(a.id) - bundleIds.indexOf(b.id))
    : [];
  const isBundle = bundle.length > 0;
  const lessonCount = isBundle ? bundle.reduce((a, b) => a + b.lessons.length, 0) : course.lessons.length;
  const totalMin = (isBundle ? bundle.flatMap((b) => b.lessons) : course.lessons).reduce((a, l) => a + (l.durationMin ?? 0), 0);
  const normalPrice = bundle.reduce((a, b) => a + b.priceRupiah, 0);
  // Pengajar paket = pengajar kursus itu sendiri, atau semua pengajar dari kursus isinya.
  const teachers = [course.teacher, ...bundle.map((b) => b.teacher)]
    .filter((t): t is NonNullable<typeof t> => !!t && !isPlaceholder(t.displayName))
    .filter((t, i, all) => all.findIndex((x) => x.id === t.id) === i);
  const isFree = course.priceRupiah === 0;
  const thumbs = (isBundle ? bundle : [course]).filter((b) => b.coverUrl);
  const hasPreview = !isBundle && course.lessons.some((l) => l.isFreePreview);
  const contact = await getContent("contact.main");

  // Di dashboard pratinjau diputar di pop-up, jadi sumber videonya disiapkan di sini (hanya pelajaran gratis).
  const previews = new Map<string, { title: string; src: VideoSource }>();
  if (inDash && hasPreview) {
    const free = await db.lesson.findMany({ where: { courseId: course.id, isFreePreview: true, status: "PUBLISHED" }, select: { id: true, title: true, videoUrl: true } });
    for (const l of free) {
      const src = parseVideoUrl(l.videoUrl);
      if (src) previews.set(l.id, { title: `${course.title} · ${l.title}`, src });
    }
  }
  const firstPreview = course.lessons.map((l) => previews.get(l.id)).find(Boolean);

  const bundleHref = (s: string) => (inDash ? `/dashboard/katalog/${s}` : `/kursus/${s}`);

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
    const unlocks = unlockedCourseIds(course);
    const active = await db.enrollment.count({ where: { userId: user.id, courseId: { in: unlocks }, status: "ACTIVE" } });
    if (active === unlocks.length) state = { kind: "enrolled", href: isBundle ? "/dashboard/kursus" : `/dashboard/kursus/${course.slug}` };
    else if (isFree) state = { kind: "free" };
    else {
      const pending = await db.order.findFirst({
        where: { userId: user.id, courseId: course.id, status: "PENDING", expiresAt: { gt: new Date() } },
      });
      state = pending?.payUrl ? { kind: "pending", payUrl: pending.payUrl, until: dateTimeWib(pending.expiresAt), orderId: pending.id } : { kind: "paid" };
    }
  }

  const facts = isBundle
    ? [
        ...bundle.map((b) => `Kelas ${b.title}`),
        `${lessonCount} pelajaran${totalMin ? ` · ${hoursLabel(totalMin)}` : ""}`,
        "Video dari pengajar, bisa diulang",
        "Akses selamanya",
      ]
    : [
        `${lessonCount} pelajaran${totalMin ? ` · ${hoursLabel(totalMin)}` : ""}`,
        "Video dari pengajar, bisa diulang",
        "Catatan pribadi per pelajaran",
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
    <div className={`kd-root${inDash ? " in-dash" : ""}`}>
      {visible && <TrackCourseView courseId={course.id} />}
      {!inDash && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <section className="kd-hero gutter">
        <div className="wrap">
          {!inDash && (
            <nav className="breadcrumb" aria-label="Jejak halaman">
              <Link href="/kursus">Katalog</Link> › <Link href={`/kursus?bidang=${field}`}>{FIELD_LABEL[field]}</Link> › <span aria-current="page">{course.title}</span>
            </nav>
          )}
          {!visible && <div className="preview-banner" style={{ marginTop: 12 }}>Pratinjau: kursus ini belum tayang ke publik.</div>}

          <div className="kd-hero-grid">
            <div className="kd-copy">
              <p className="kd-kicker">{isBundle ? `Paket ${bundle.map((b) => FIELD_LABEL[b.field as Field]).join(" + ")}` : `Ilmu ${FIELD_LABEL[field]} · Marhalah ${LEVEL_LABEL[level]}`}</p>
              <h1>{course.title}</h1>
              {teachers.length > 0 && (
                <p className="kd-by">
                  {teachers.map((t) => <span key={t.id}>{isBundle ? shortName(t.displayName) : t.displayName}</span>)}
                </p>
              )}
              <p className="kd-facts">{isBundle ? `${bundle.length} kelas · ` : ""}{lessonCount} pertemuan{totalMin ? ` · ${hoursLabel(totalMin)?.replace("± ", "±")} rekaman` : ""}</p>
              {hasPreview && !inDash && <Link className="kd-hero-link" href={`/kursus/${course.slug}/pratinjau`}><PlayCircle size={16} aria-hidden="true" /> Tonton pertemuan 1 gratis</Link>}
              {firstPreview && <PreviewDialog className="kd-hero-link" label="Tonton pertemuan 1 gratis" title={firstPreview.title} src={firstPreview.src} />}
            </div>

            <div className="kd-media" aria-hidden="true">
              {thumbs.length > 0
                ? <span className={`kd-thumbs${thumbs.length > 1 ? " two" : ""}`}>{thumbs.slice(0, 2).map((b, i) => <Thumb key={b.id} className="kd-thumb" src={b.coverUrl as string} priority={i === 0} sizes={thumbs.length > 1 ? "(max-width: 860px) 70vw, 360px" : "(max-width: 860px) 92vw, 560px"} />)}</span>
                : course.titleAr && <p className="kd-ar" lang="ar" dir="rtl">{course.titleAr}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="gutter">
        <div className="wrap kd-layout">
          <div className="kd-main">
            {!inDash && (
              <nav className="kd-tabs" aria-label="Lompat ke bagian">
                <a href="#tentang">Tentang</a>
                <a href="#silabus">{isBundle ? "Isi paket" : "Silabus"}</a>
                <a href="#pengajar">Pengajar</a>
                <a href="#bantuan">Bantuan</a>
              </nav>
            )}

            <section className="kd-sec" id="tentang" aria-labelledby="tentang-h">
              <h2 id="tentang-h">Tentang kelas</h2>
              {course.description ? <Markdown source={course.description} /> : <p className="muted">Deskripsi kelas akan segera ditambahkan.</p>}
            </section>

            {isBundle ? (
              <section className="kd-sec" id="silabus" aria-labelledby="silabus-h">
                <h2 id="silabus-h">Isi paket · {bundle.length} kelas</h2>
                <ul className="kd-bundle">
                  {bundle.map((b) => (
                    <li key={b.id}>
                      {b.coverUrl ? <Thumb src={b.coverUrl} sizes="104px" /> : <span className="ph" aria-hidden="true" />}
                      <div>
                        <h3>{b.status === "PUBLISHED" ? <Link href={bundleHref(b.slug)}>{b.title}</Link> : b.title}</h3>
                        <p>Ilmu {FIELD_LABEL[b.field as Field]} · {b.lessons.length} pertemuan</p>
                      </div>
                      <s className="num">{rupiah(b.priceRupiah)}</s>
                    </li>
                  ))}
                </ul>
                {normalPrice > course.priceRupiah && <p className="kd-save">Hemat {rupiah(normalPrice - course.priceRupiah)} dibanding beli satu per satu</p>}
              </section>
            ) : (
              <section className="kd-sec" id="silabus" aria-labelledby="silabus-h">
                <h2 id="silabus-h">Silabus · {course.lessons.length} pertemuan</h2>
                {course.lessons.length ? (
                  <ol className="kd-syl">
                    {course.lessons.map((l) => {
                      const preview = previews.get(l.id);
                      return (
                        <li key={l.id}>
                          <span className="no">{String(l.position).padStart(2, "0")}</span>
                          <span className="tt">{l.title}</span>
                          <span className="kd-meta">
                            {l.isFreePreview && inDash && preview ? (
                              <PreviewDialog className="free" label="Tonton gratis" title={preview.title} src={preview.src} />
                            ) : l.isFreePreview && !inDash ? (
                              <Link className="free" href={`/kursus/${course.slug}/pratinjau`}><PlayCircle size={14} aria-hidden="true" /> Tonton gratis</Link>
                            ) : (
                              <Lock size={14} aria-label="Terkunci" />
                            )}
                            {l.durationMin ? <span className="num">{l.durationMin} mnt</span> : null}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : <p className="muted">Pertemuan sedang disiapkan.</p>}
              </section>
            )}

            <section className="kd-sec" id="pengajar" aria-labelledby="pengajar-h">
              <h2 id="pengajar-h">{teachers.length > 1 ? "Para pengajar" : "Pengajar"}</h2>
              {teachers.length ? (
                <div className="kd-teachers">
                  {teachers.map((t) => (
                    <div key={t.id} className="kd-teacher">
                      <div>
                        <h3>{t.displayName}</h3>
                        {!isPlaceholder(t.alumni) && <p>{t.alumni}</p>}
                        {!isPlaceholder(t.sanad) && <p>{t.sanad}</p>}
                        {!isPlaceholder(t.bio) && <p>{t.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="muted">Profil pengajar akan segera ditambahkan.</p>}
            </section>

            <section className="kd-sec" id="bantuan" aria-labelledby="bantuan-h">
              <h2 id="bantuan-h">Pertanyaan umum</h2>
              <div className="faq" style={{ maxWidth: "none" }}>
                <details><summary>Bagaimana cara mulai belajar?<span className="plus" aria-hidden="true">+</span></summary><p>{isFree ? "Klik Daftar gratis. Kelas langsung terbuka." : inDash ? "Klik tombol bayar, isi nomor WhatsApp, lalu bayar lewat Mayar. Jendela pembayaran muncul di sini, dan kelas terbuka otomatis setelah lunas." : "Klik Daftar dan bayar, masuk dengan Google, isi nomor WhatsApp, lalu bayar lewat Mayar. Kelas terbuka otomatis setelah lunas."}</p></details>
                <details><summary>Bagaimana jika ada kendala?<span className="plus" aria-hidden="true">+</span></summary><p>Hubungi admin lewat WhatsApp {contact.whatsapp}. Ketentuan pengembalian dana ada di <Link href={inDash ? "/dashboard/bantuan" : "/refund"}>{inDash ? "halaman Bantuan" : "Kebijakan refund"}</Link>.</p></details>
              </div>
            </section>
          </div>

          <BuyPanel
            courseId={course.id}
            learnHref={isBundle ? "/dashboard/kursus" : `/dashboard/kursus/${course.slug}`}
            title={course.title}
            titleAr={course.titleAr}
            priceLabel={rupiah(course.priceRupiah)}
            normalLabel={isBundle && normalPrice > course.priceRupiah ? rupiah(normalPrice) : undefined}
            saveLabel={isBundle && normalPrice > course.priceRupiah ? `hemat ${rupiah(normalPrice - course.priceRupiah)}` : undefined}
            priceNumber={course.priceRupiah}
            isFree={isFree}
            isBundle={isBundle}
            facts={facts}
            state={state}
            autoOpen={lanjut}
            whatsappDefault={user?.whatsapp ? "0" + user.whatsapp.replace(/^62/, "") : ""}
          />
        </div>
      </div>
    </div>
  );
}
