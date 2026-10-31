import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { GoogleG } from "@/components/HeaderAuth";
import { SubmitButton } from "@/components/SubmitButton";
import { signIn, googleEnabled, devLoginEnabled } from "@/auth";
import { getCurrentUser, safeCallback } from "@/lib/auth-guard";
import { withBase, demoMode } from "@/lib/base-path";
import { getContent } from "@/lib/content";
import { getPublishedCourses } from "@/lib/queries";
import { LoginHero } from "./LoginHero";
import "@/styles/login.css";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const to = safeCallback(sp.callbackUrl);
  if (await getCurrentUser()) redirect(to);

  // Gambar panel kiri: thumbnail kelas yang tayang (paket di depan); teksnya dari pengaturan teks website.
  const [courses, copy] = await Promise.all([getPublishedCourses(), getContent("site.copy")]);
  const images = Array.from(new Set(courses.map((c) => c.image).filter((s): s is string => !!s)));

  async function google() {
    "use server";
    await signIn("google", { redirectTo: withBase(to) });
  }
  async function dev(fd: FormData) {
    "use server";
    await signIn("dev", { email: String(fd.get("email") ?? ""), redirectTo: withBase(to) });
  }

  return (
    <main className="lg">
      <LoginHero images={images} headline={copy.catalogTitle} text={copy.footerDescription} />

      <section className="lg-side" aria-labelledby="masuk-h">
        <div className="lg-card">
          <h1 id="masuk-h">Selamat datang kembali!</h1>
          <p className="lg-sub">Masuk untuk lanjut belajar dan membuka kelas yang sudah kamu miliki.</p>

          {sp.error && <div className="alert err-box" role="alert">Masuk gagal. Coba lagi atau gunakan akun Google lain.</div>}

          {googleEnabled ? (
            <form action={google}>
              <SubmitButton className="lg-google" pendingText="Mengalihkan ke Google…" testId="login-google"><GoogleG /> Masuk dengan Google</SubmitButton>
            </form>
          ) : (
            !devLoginEnabled && <div className="alert info-box" role="status">Login Google belum dikonfigurasi di server ini.</div>
          )}

          <ul className="lg-points" aria-label="Keuntungan masuk">
            <li><Check size={16} aria-hidden="true" /> Tanpa kata sandi baru, cukup akun Google</li>
            <li><Check size={16} aria-hidden="true" /> Progres belajar dan catatanmu tersimpan di akun</li>
            <li><Check size={16} aria-hidden="true" /> Kelas yang sudah dibeli langsung terbuka</li>
          </ul>

          {devLoginEnabled && (
            <form action={dev} className="lg-dev" aria-label="Login uji lokal">
              <p className="eyebrow">{demoMode ? "Mode demo: data contoh, bisa direset sewaktu-waktu" : "Hanya untuk pengembangan lokal"}</p>
              <div className="field" style={{ marginTop: 10 }}>
                <label htmlFor="email">Email akun uji</label>
                <select id="email" name="email" className="select" defaultValue="siswa@contoh.test" data-testid="dev-email">
                  <option value="siswa@contoh.test">siswa@contoh.test (siswa)</option>
                  <option value="ustadz@contoh.test">ustadz@contoh.test (pengajar)</option>
                  <option value="admin@contoh.test">admin@contoh.test (admin)</option>
                </select>
              </div>
              <div style={{ marginTop: 12 }}><SubmitButton className="btn btn-primary block" testId="login-dev">Masuk (uji)</SubmitButton></div>
            </form>
          )}

          <p className="lg-terms">
            Belum punya akun? Akun dibuat otomatis saat pertama kali masuk dengan Google. Dengan masuk, kamu menyetujui{" "}
            <a href={withBase("/syarat")}>Syarat dan ketentuan</a> dan <a href={withBase("/privasi")}>Kebijakan privasi</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
