"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Menyegarkan status order tiap 5 detik selama 3 menit; setelah itu tombol manual (PRD 9.3). */
export function PollRefresh() {
  const router = useRouter();
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (n > 36) { clearInterval(t); setStopped(true); return; }
      router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router]);
  return stopped ? (
    <button type="button" className="btn btn-ghost sm" onClick={() => { router.refresh(); }} data-testid="manual-refresh">Cek status</button>
  ) : (
    <span className="small muted" role="status">Memeriksa status otomatis…</span>
  );
}
