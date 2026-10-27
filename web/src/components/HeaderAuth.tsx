"use client";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { useEffect, useState } from "react";
import { initials } from "@/lib/format";

type Me = { name: string | null; role: string } | null;

/** Bagian header yang bergantung login. Halaman tetap statis; tombol Masuk sudah ada di HTML awal (U3). */
export function HeaderAuth() {
  const [me, setMe] = useState<Me>(null);
  useEffect(() => {
    let alive = true;
    fetch(withBase("/api/me"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setMe(j?.user ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (me) {
    return (
      <Link className="btn btn-ghost sm" href="/dashboard" data-testid="hdr-dashboard">
        <span className="avatar sm" aria-hidden="true">{initials(me.name)}</span>
        Dashboard
      </Link>
    );
  }
  return (
    <Link className="btn btn-ghost sm" href="/masuk" data-testid="hdr-login">
      <GoogleG />
      <span>Masuk</span>
    </Link>
  );
}

export function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" />
    </svg>
  );
}
