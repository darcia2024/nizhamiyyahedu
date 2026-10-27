import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nizhamiyyah Edu",
    short_name: "Nizhamiyyah",
    description: "Kelas kitab daring dengan kurikulum berjenjang ala pesantren Timur Tengah.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F3F5F1",
    theme_color: "#1B4D3B",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
