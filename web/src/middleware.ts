import { NextResponse, type NextRequest } from "next/server";

// Nama cookie sesi Auth.js v5 (https memakai awalan __Secure-; cookie besar dipecah jadi .0, .1, ...).
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

/**
 * Pengguna yang sudah login tidak perlu melihat beranda lagi: langsung ke /dashboard
 * (admin diteruskan ke /admin oleh halaman itu). Beranda baru tampil lagi setelah logout.
 * Hanya memeriksa adanya cookie sesi supaya beranda tetap statis dan cepat untuk pengunjung baru;
 * keabsahan sesinya diperiksa halaman tujuan. Tambahkan ?publik=1 untuk melihat beranda sambil login
 * (berguna bagi admin yang mengubah teks beranda).
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.searchParams.get("publik") === "1") return NextResponse.next();
  const loggedIn = req.cookies.getAll().some((c) => SESSION_COOKIES.some((n) => c.name === n || c.name.startsWith(`${n}.`)));
  if (!loggedIn) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/dashboard";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/"] };
