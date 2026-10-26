import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/PublicChrome";
import { GoogleG } from "@/components/HeaderAuth";
import { SubmitButton } from "@/components/SubmitButton";
import { signIn, googleEnabled, devLoginEnabled } from "@/auth";
import { getCurrentUser, safeCallback } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const to = safeCallback(sp.callbackUrl);
  if (await getCurrentUser()) redirect(to);

  async function google() {
    "use server";
    await signIn("google", { redirectTo: to });
  }
  async function dev(fd: FormData) {
    "use server";
    await signIn("dev", { email: String(fd.get("email") ?? ""), redirectTo: to });
  }

  return (
    <PublicShell>
      <div className="gutter" style={{ paddingBlock: "56px 96px" }}>
        <div style={{ maxWidth: 440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 className="serif" style={{ fontWeight: 600, fontSize: 34, lineHeight: 1.15 }}>Masuk ke Nizhamiyyah Edu</h1>
          <p className="muted">Masuk dengan akun Google, tanpa perlu mengingat kata sandi baru. Setelah masuk Anda kembali ke halaman yang tadi dibuka.</p>
          {sp.error && <div className="alert err-box" role="alert">Masuk gagal. Coba lagi atau gunakan akun Google lain.</div>}

          {googleEnabled ? (
            <form action={google}>
              <SubmitButton className="btn btn-ghost block" pendingText="Mengalihkan ke Google…" testId="login-google"><GoogleG /> Masuk dengan Google</SubmitButton>
            </form>
          ) : (
            !devLoginEnabled && <div className="alert info-box" role="status">Login Google belum dikonfigurasi di server ini.</div>
          )}

          {devLoginEnabled && (
            <form action={dev} className="block" style={{ marginTop: 8 }} aria-label="Login uji lokal">
              <p className="eyebrow">Hanya untuk pengembangan lokal</p>
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
          <p className="small muted">Dengan masuk, Anda menyetujui <a href="/syarat">Syarat dan ketentuan</a> dan <a href="/privasi">Kebijakan privasi</a>.</p>
        </div>
      </div>
    </PublicShell>
  );
}
