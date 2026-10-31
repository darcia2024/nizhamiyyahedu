import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CourseDetail } from "@/components/CourseDetail";
import { requireUser } from "@/lib/auth-guard";
import { getCourseBySlug } from "@/lib/queries";
import "@/styles/course-sheet.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCourseBySlug((await params).slug);
  return { title: c?.title ?? "Kelas" };
}

/** Versi halaman penuh dari detail kelas (dibuka langsung lewat alamat, bukan dari dalam dashboard). Tetap di dalam kerangka dashboard. */
export default async function DashboardCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/katalog/${slug}`);
  return (
    <AppShell user={user} active="katalog">
      <div className="cs-page">
        <Link className="cs-back" href="/dashboard/katalog"><ArrowLeft size={16} aria-hidden="true" /> Katalog kelas</Link>
        <CourseDetail slug={slug} variant="dashboard" />
      </div>
    </AppShell>
  );
}
