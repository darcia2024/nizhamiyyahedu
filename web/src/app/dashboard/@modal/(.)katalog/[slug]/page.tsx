import { CourseDetail } from "@/components/CourseDetail";
import { RouteModal } from "@/components/RouteModal";

/** Mencegat /dashboard/katalog/[slug] saat dibuka dari halaman dashboard: detail kelas tampil sebagai pop-up. */
export default async function CourseModalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <RouteModal label="Detail kelas">
      <CourseDetail slug={slug} variant="dashboard" />
    </RouteModal>
  );
}
