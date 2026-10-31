import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicChrome";
import { CourseDetail } from "@/components/CourseDetail";
import { getCourseBySlug } from "@/lib/queries";

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

/** Halaman kelas untuk pengunjung. Pengguna yang sudah login memakai versi di dalam dashboard (/dashboard/katalog/[slug]). */
export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  return (
    <PublicShell>
      <CourseDetail slug={slug} variant="public" lanjut={sp.lanjut === "1"} managerPreview={sp.pratinjau === "1"} />
    </PublicShell>
  );
}
