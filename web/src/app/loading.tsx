// Saat pindah halaman: bilah tipis di atas dan kerangka konten, seperti aplikasi native yang sedang memuat.
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>
      <div className="pwa-progress" aria-hidden="true" />
      <div className="pwa-skeleton" aria-hidden="true">
        <i style={{ height: 30, width: "42%" }} />
        <i style={{ height: 16, width: "68%" }} />
        <i style={{ height: 180 }} />
        <i style={{ height: 96 }} />
        <i style={{ height: 96 }} />
      </div>
    </div>
  );
}
