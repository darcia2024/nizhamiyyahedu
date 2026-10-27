import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nizhamiyyah Edu",
    short_name: "Nizhamiyyah",
    description: "Kelas kitab daring dengan kurikulum berjenjang ala pesantren Timur Tengah.",
    start_url: withBase("/dashboard"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#F3F5F1",
    theme_color: "#1B4D3B",
    lang: "id",
    icons: [
      { src: withBase("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: withBase("/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: withBase("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
