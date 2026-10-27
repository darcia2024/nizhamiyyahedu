import { ImageResponse } from "next/og";
import { getCourseBySlug } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL, type Field, type Level } from "@/lib/constants";
import { rupiah } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Kursus di Nizhamiyyah Edu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCourseBySlug(slug);
  const visible = c && c.status === "PUBLISHED" && !c.archivedAt;
  const title = visible ? c.title : "Nizhamiyyah Edu";
  // Teks Arab tidak dirender di sini: satori butuh berkas font Arab. Pratinjau memakai judul Latin.
  const meta = visible
    ? [FIELD_LABEL[c.field as Field], `Jenjang ${LEVEL_LABEL[c.level as Level]}`, `${c.lessons.length} pelajaran`].join("  ·  ")
    : "Belajar kitab, satu marhalah demi satu marhalah.";
  const price = visible ? (c.priceRupiah === 0 ? "Gratis" : rupiah(c.priceRupiah)) : "";
  const teacher = visible && c.teacher ? `Pengajar: ${c.teacher.displayName}` : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0F4736", color: "#f2e6c4", padding: 80, fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 26, letterSpacing: 5 }}>NIZHAMIYYAH EDU</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: "#d6ddd7", marginBottom: 24 }}>{meta}</div>
          <div style={{ fontSize: title.length > 40 ? 60 : 76, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32 }}>
          <div style={{ color: "#d6ddd7" }}>{teacher}</div>
          <div>{price}</div>
        </div>
      </div>
    ),
    size,
  );
}
