"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { formatVideoTime, playerEmbedSrc } from "@/lib/video";
import "@/styles/lesson-player.css";

type YTPlayer = {
  playVideo(): void; pauseVideo(): void; seekTo(s: number, allowAhead: boolean): void;
  getCurrentTime(): number; getDuration(): number; getPlayerState(): number;
  mute(): void; unMute(): void; setVolume(v: number): void;
  setPlaybackRate(r: number): void; getAvailablePlaybackRates(): number[];
};
type YTNamespace = { Player: new (el: HTMLIFrameElement, opts: { events: Record<string, (e: { data: number }) => void> }) => YTPlayer };
type YTWindow = Window & { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };

const PLAYING = 1, ENDED = 0, BUFFERING = 3;
const API_TIMEOUT = 10000, START_TIMEOUT = 3000;

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const w = window as YTWindow;
    if (w.YT?.Player) return resolve(w.YT);
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { previous?.(); if (w.YT) resolve(w.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { apiPromise = null; reject(new Error("API YouTube gagal dimuat")); };
    document.head.append(s);
  });
  return apiPromise;
}

const load = (key: string) => { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } };
const save = (key: string, v: number) => { try { if (v > 0) localStorage.setItem(key, String(Math.floor(v))); else localStorage.removeItem(key); } catch { /* penyimpanan diblokir */ } };

/** Player sendiri di atas YouTube: tampilan YouTube ditutup supaya judul, logo, dan tombol bagikan tidak bisa diklik. */
export function LessonPlayer({ embedUrl, lessonId, title }: { embedUrl: string; lessonId: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeDone = useRef(false);
  const key = `nz-video-${lessonId}`;
  const videoId = embedUrl.split("/").pop();

  const [origin, setOrigin] = useState("");
  const [native, setNative] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [rates, setRates] = useState<number[]>([1]);
  const [rate, setRate] = useState(1);
  const [full, setFull] = useState(false);
  const [cssFull, setCssFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [resumeAt, setResumeAt] = useState(0);

  useEffect(() => { setOrigin(window.location.origin); setResumeAt(load(key)); }, [key]);

  useEffect(() => {
    if (!origin || native || !frame.current) return;
    let alive = true;
    const el = frame.current;
    const fail = setTimeout(() => { if (alive && !player.current) setNative(true); }, API_TIMEOUT);
    loadApi().then((YT) => {
      if (!alive) return;
      const p = new YT.Player(el, {
        events: {
          onReady: () => {
            clearTimeout(fail);
            if (!alive) return;
            player.current = p;
            setReady(true);
            setDuration(p.getDuration() || 0);
            setRates(p.getAvailablePlaybackRates() || [1]);
          },
          onStateChange: ({ data }) => {
            if (!alive) return;
            const active = data === PLAYING || data === BUFFERING;
            if (active) clearTimeout(startTimer.current);
            setPlaying(active);
            if (data === PLAYING) setDuration(p.getDuration() || 0);
            if (data === ENDED) save(key, 0);
          },
          onError: () => { if (alive) setNative(true); },
        },
      });
    }).catch(() => { if (alive) setNative(true); });
    return () => { alive = false; clearTimeout(fail); clearTimeout(startTimer.current); };
  }, [origin, native, key]);

  useEffect(() => {
    if (!playing) return;
    let tick = 0;
    const t = setInterval(() => {
      const p = player.current;
      if (!p) return;
      const now = p.getCurrentTime() || 0;
      setTime(now);
      if (++tick % 10 === 0) save(key, now);
    }, 500);
    return () => clearInterval(t);
  }, [playing, key]);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p) return;
    if (p.getPlayerState() === PLAYING || p.getPlayerState() === BUFFERING) {
      p.pauseVideo();
      setPlaying(false);
      save(key, p.getCurrentTime() || 0);
      return;
    }
    if (!resumeDone.current) {
      resumeDone.current = true;
      if (resumeAt > 5) { p.seekTo(resumeAt, true); setTime(resumeAt); }
    }
    p.playVideo();
    // Sebagian HP menolak perintah putar lewat API. Kalau begitu, pakai tombol bawaan YouTube.
    clearTimeout(startTimer.current);
    startTimer.current = setTimeout(() => {
      const state = player.current?.getPlayerState();
      if (state !== PLAYING && state !== BUFFERING) setNative(true);
    }, START_TIMEOUT);
  }, [key, resumeAt]);

  const seek = useCallback((to: number) => {
    const p = player.current;
    if (!p) return;
    const target = Math.min(Math.max(0, to), p.getDuration() || to);
    resumeDone.current = true;
    p.seekTo(target, true);
    setTime(target);
    save(key, target);
  }, [key]);

  const toggleMute = () => {
    const p = player.current;
    if (!p) return;
    if (muted) p.unMute(); else p.mute();
    setMuted(!muted);
  };
  const changeVolume = (v: number) => {
    const p = player.current;
    if (!p) return;
    p.setVolume(v);
    setVolume(v);
    if (v > 0 && muted) { p.unMute(); setMuted(false); }
  };
  const changeRate = (r: number) => { player.current?.setPlaybackRate(r); setRate(r); };

  const toggleFull = useCallback(() => {
    if (cssFull) return setCssFull(false);
    if (document.fullscreenElement) { void document.exitFullscreen(); return; }
    const el = box.current;
    // iPhone tidak mendukung fullscreen untuk elemen biasa, jadi player dibentangkan selebar layar.
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => setCssFull(true));
    else setCssFull(true);
  }, [cssFull]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 3000);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "SELECT" || (tag === "BUTTON" && e.key === " ")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seek(time - 10); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seek(time + 10); }
    else if (e.key === "m") toggleMute();
    else if (e.key === "f") toggleFull();
  };

  const isFull = full || cssFull;
  const showPoster = !native && !playing;
  return (
    <div ref={box} className={`video lp${native ? " lp-native" : ""}${cssFull ? " lp-full" : ""}${playing && idle ? " lp-idle" : ""}`} tabIndex={0} role="group" aria-label={`Pemutar video: ${title}`}
      onKeyDown={onKey} onMouseMove={wake} onTouchStart={wake} onContextMenu={(e) => e.preventDefault()}>
      {origin && (
        <iframe
          key={native ? "native" : "custom"}
          ref={frame}
          src={playerEmbedSrc(embedUrl, origin, native)}
          title="Video pelajaran"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen={native}
          tabIndex={native ? 0 : -1}
        />
      )}
      {!native && (
        <>
          {showPoster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="lp-poster" src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" referrerPolicy="no-referrer" />
          )}
          <button type="button" className="lp-shield" onClick={toggle} aria-label={playing ? "Jeda" : "Putar"} tabIndex={-1} disabled={!ready}>
            {!playing && (
              <span className="lp-big">
                <Play size={34} fill="currentColor" aria-hidden="true" />
                {ready && resumeAt > 5 && !resumeDone.current && <small>Lanjut dari {formatVideoTime(resumeAt)}</small>}
              </span>
            )}
          </button>
          <div className="lp-bar">
            <input className="lp-seek" type="range" min={0} max={Math.max(duration, 1)} step={1} value={Math.min(time, duration || time)} onChange={(e) => seek(Number(e.target.value))} aria-label="Posisi video" aria-valuetext={formatVideoTime(time)} disabled={!ready} />
            <div className="lp-row">
              <button type="button" onClick={toggle} aria-label={playing ? "Jeda" : "Putar"} disabled={!ready}>{playing ? <Pause size={20} fill="currentColor" aria-hidden="true" /> : <Play size={20} fill="currentColor" aria-hidden="true" />}</button>
              <button type="button" onClick={() => seek(time - 10)} aria-label="Mundur 10 detik" disabled={!ready}><RotateCcw size={18} aria-hidden="true" /></button>
              <button type="button" onClick={() => seek(time + 10)} aria-label="Maju 10 detik" disabled={!ready}><RotateCw size={18} aria-hidden="true" /></button>
              <span className="lp-time">{formatVideoTime(time)} / {formatVideoTime(duration)}</span>
              <span className="lp-spacer" />
              <button type="button" onClick={toggleMute} aria-label={muted ? "Nyalakan suara" : "Matikan suara"} disabled={!ready}>{muted || volume === 0 ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}</button>
              <input className="lp-volume" type="range" min={0} max={100} value={muted ? 0 : volume} onChange={(e) => changeVolume(Number(e.target.value))} aria-label="Volume" disabled={!ready} />
              <select value={rate} onChange={(e) => changeRate(Number(e.target.value))} aria-label="Kecepatan" disabled={!ready}>
                {rates.map((r) => <option key={r} value={r}>{r}x</option>)}
              </select>
              <button type="button" onClick={toggleFull} aria-label={isFull ? "Keluar dari layar penuh" : "Layar penuh"}>{isFull ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
