"use client";
import { useEffect } from "react";
import { PAY_MESSAGE } from "@/lib/pay";

/** Dipakai saat halaman status tampil di dalam iframe pop-up pembayaran: kabari halaman induk begitu statusnya berubah. */
export function EmbedNotify({ orderId, status }: { orderId: string; status: string }) {
  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: PAY_MESSAGE, orderId, status }, window.location.origin);
  }, [orderId, status]);
  return null;
}
