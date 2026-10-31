"use client";
import { useEffect, useRef, useState } from "react";
import { PlayCircle, X } from "lucide-react";
import type { VideoSource } from "@/lib/video";
import "@/styles/course-sheet.css";

/** Tombol yang memutar pelajaran pratinjau gratis di pop-up, jadi pengguna tidak meninggalkan halaman yang sedang dibuka. */
export function PreviewDialog({ label, className, title, src }: { label: string; className?: string; title: string; src: VideoSource }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <PlayCircle size={15} aria-hidden="true" /> {label}
      </button>
      {open && (
        <dialog
          ref={ref}
          className="preview-dialog"
          aria-label={title}
          onClose={() => setOpen(false)}
          onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        >
          <div className="preview-box">
            <header>
              <b>{title}</b>
              <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => ref.current?.close()}><X size={18} aria-hidden="true" /></button>
            </header>
            <div className="preview-player">
              {src.kind === "youtube"
                ? <iframe title={title} src={`${src.embedUrl}?rel=0&modestbranding=1`} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                : <video src={src.src} controls playsInline autoPlay />}
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
