/**
 * Awalan alamat aplikasi. Kosong di lokal; "/web" saat dipasang di nizhamiyyahedu.vercel.app/web.
 * Link next/link dan redirect() sudah otomatis memakai basePath. Fungsi ini untuk sisanya:
 * <a>, <img>, next/image, fetch(), action form GET dan redirectTo Auth.js.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path);

/** Mode demo publik: login akun contoh dan simulasi Mayar aktif walau NODE_ENV=production. Data demo tidak permanen. */
export const demoMode = process.env.DEMO_MODE === "1";
