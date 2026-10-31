import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Nizhamiyyah Edu" }, robots: { index: false, follow: false } };

/** `modal` adalah slot paralel: detail kelas tampil sebagai pop-up di atas halaman dashboard mana pun (lihat @modal). */
export default function DashboardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return <>{children}{modal}</>;
}
