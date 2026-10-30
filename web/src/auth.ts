import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { db } from "@/lib/db";
import { basePath, demoMode } from "@/lib/base-path";

// Login uji hanya di lokal, kecuali deployment demo publik yang memakai DEMO_MODE=1 dan database contoh.
const devLogin = (process.env.DEV_LOGIN === "1" && process.env.NODE_ENV !== "production") || demoMode;

const providers: Provider[] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
}
if (devLogin) {
  // Login uji untuk pengembangan lokal. Tidak aktif di production.
  providers.push(
    Credentials({
      id: "dev",
      name: "Login uji",
      credentials: { email: {} },
      async authorize(c) {
        const email = String(c?.email ?? "").toLowerCase().trim();
        if (!email) return null;
        const u = await db.user.findUnique({ where: { email } });
        return u ? { id: u.id, email: u.email, name: u.name } : null;
      },
    }),
  );
}

const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const googleEnabled = providers.some((p) => (typeof p === "function" ? false : p.id === "google"));
export const devLoginEnabled = devLogin;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  basePath: `${basePath}/api/auth`,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/masuk" },
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "dev") return true;
      if (account?.provider === "google" && profile?.email_verified !== true) return false;
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      // Email di ADMIN_EMAILS (dipisah koma) otomatis jadi superadmin saat login Google.
      const admin = adminEmails().includes(email);
      await db.user.upsert({
        where: { email },
        update: { name: user.name ?? undefined, image: user.image ?? undefined, ...(admin ? { role: "ADMIN" } : {}) },
        create: { email, name: user.name, image: user.image, role: admin ? "ADMIN" : "STUDENT" },
      });
      return true;
    },
    async jwt({ token }) {
      if (token.email && !token.uid) {
        const u = await db.user.findUnique({ where: { email: token.email.toLowerCase() }, select: { id: true } });
        if (u) token.uid = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) (session.user as { id?: string }).id = token.uid as string;
      return session;
    },
  },
});
