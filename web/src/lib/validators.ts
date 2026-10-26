import { z } from "zod";
import { FIELDS, LEVELS, MAX_PRICE, ROLES } from "@/lib/constants";
import { SLUG_RE } from "@/lib/slug";
import { parseVideoUrl } from "@/lib/video";

const text = (label: string, min: number, max: number) =>
  z.string().trim().normalize("NFC")
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`)
    .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s), `${label} mengandung karakter yang tidak diizinkan.`);

export const courseSchema = z.object({
  title: text("Judul", 3, 120),
  titleAr: z.string().trim().max(120, "Judul Arab maksimal 120 karakter.").optional().default(""),
  slug: z.string().trim().toLowerCase().min(3, "Alamat halaman minimal 3 karakter.").max(80, "Alamat halaman maksimal 80 karakter.").regex(SLUG_RE, "Alamat halaman hanya huruf kecil, angka, dan tanda hubung."),
  field: z.enum(FIELDS, { message: "Pilih bidang ilmu." }),
  level: z.enum(LEVELS, { message: "Pilih jenjang." }),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1.000 karakter.").default(""),
  priceRupiah: z.coerce.number({ message: "Harga harus angka." }).int("Harga harus bilangan bulat.").min(0, "Harga tidak boleh negatif.").max(MAX_PRICE, "Harga maksimal Rp 50.000.000.").optional(),
  teacherId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const matanSchema = z.array(z.object({ ar: z.string().trim().min(1).max(2000), id: z.string().trim().max(2000).default("") })).max(100, "Maksimal 100 blok matan.");

export const lessonSchema = z.object({
  title: text("Judul pelajaran", 3, 120),
  durationMin: z.coerce.number().int().min(0).max(600, "Durasi maksimal 600 menit.").optional(),
  videoUrl: z.string().trim().max(500, "URL video terlalu panjang.").optional().default("")
    .refine((v) => !v || parseVideoUrl(v) !== null, "URL video harus dari YouTube atau file video langsung dari host yang diizinkan."),
  matanJson: z.string().optional().default("")
    .transform((s, ctx) => {
      if (!s.trim()) return [] as z.infer<typeof matanSchema>;
      try {
        const r = matanSchema.safeParse(JSON.parse(s));
        if (!r.success) { ctx.addIssue({ code: "custom", message: "Format matan tidak valid." }); return z.NEVER; }
        return r.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Format matan tidak valid." });
        return z.NEVER;
      }
    }),
  notesMd: z.string().max(50_000, "Catatan maksimal 50.000 karakter.").optional().default(""),
});

export const roleSchema = z.enum(ROLES);

export const teacherSchema = z.object({
  displayName: text("Nama tampil", 3, 80),
  bio: z.string().trim().max(1000, "Bio maksimal 1.000 karakter.").default(""),
  alumni: z.string().trim().max(160).optional().default(""),
  sanad: z.string().trim().max(300).optional().default(""),
  userEmail: z.string().trim().toLowerCase().max(160).optional().default(""),
});
