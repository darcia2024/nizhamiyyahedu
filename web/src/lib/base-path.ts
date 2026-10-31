/**
 * Awalan alamat aplikasi. Kosong di lokal dan di nizhamiyyahedu.vercel.app; terisi hanya bila dipasang di sub-path.
 * Link next/link dan redirect() sudah otomatis memakai basePath. Fungsi ini untuk sisanya:
 * <a>, <img>, next/image, fetch(), action form GET dan redirectTo Auth.js.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path);

/** Untuk alamat gambar dari database: foto unggahan admin sudah berawalan basePath, foto bawaan seed belum. */
export const mediaSrc = (path: string) => (basePath && path.startsWith(`${basePath}/`) ? path : withBase(path));

/** Mode demo publik: login akun contoh dan simulasi Mayar aktif walau NODE_ENV=production. Data demo tidak permanen. */
export const demoMode = process.env.DEMO_MODE === "1";
