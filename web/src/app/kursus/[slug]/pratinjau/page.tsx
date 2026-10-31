import { redirect } from "next/navigation";

/** Pratinjau gratis sudah ditiadakan: semua pelajaran berbayar. Tautan lama diarahkan ke halaman kelasnya. */
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/kursus/${encodeURIComponent(slug)}`);
}
