import type { MetadataRoute } from "next";
import { getPublishedCourses } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3200").replace(/\/$/, "");
  const courses = await getPublishedCourses();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kursus`, changeFrequency: "weekly", priority: 0.9 },
    ...courses.map((c) => ({ url: `${base}/kursus/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["privasi", "syarat", "refund", "kontak"].map((s) => ({ url: `${base}/${s}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
