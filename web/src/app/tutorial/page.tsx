import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Compass, CreditCard, FileText, History, Lock } from "lucide-react";
import { cookies } from "next/headers";
import "@/styles/tutorial.css";
import { ActionForm, Field } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth-guard";
import { withBase } from "@/lib/base-path";
import { TUTORIAL_COOKIE, tutorialToken } from "@/lib/tutorial-pin";
import { unlockTutorial } from "./actions";
import { GROUPS, GUIDES, QUICK_LINKS } from "./guides";
import { TutorialNav } from "./TutorialNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tutorial superadmin", robots: { index: false, follow: false } };

const GROUP_ICONS = [Compass, BookOpen, CreditCard, FileText, History];

export default async function TutorialPage() {
  const [user, store] = await Promise.all([getCurrentUser(), cookies()]);
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin && store.get(TUTORIAL_COOKIE)?.value !== tutorialToken()) {
    return (
      <main id="isi" className="tutorial-gate gutter">
        <section className="card pad">
          <span className="tutorial-gate-icon"><Lock size={22} aria-hidden="true" /></span>
          <h1>Masukkan PIN</h1>
          <p>Halaman tutorial ini memakai PIN. Silakan masukkan PIN yang sudah saya berikan.</p>
          <ActionForm action={unlockTutorial} submit="Buka tutorial" pendingText="Memeriksa…" className="tutorial-gate-form">
            <Field name="pin" label="PIN" type="password" maxLength={20} full />
          </ActionForm>
        </section>
      </main>
    );
  }

  const groups = GROUPS.map((g) => ({ ...g, guides: g.ids.flatMap((id) => GUIDES.filter((x) => x.id === id)) }));
  const ordered = groups.flatMap((g) => g.guides);
  return (
    <main id="isi" className="tutorial">
      <header className="tutorial-hero gutter">
        <div className="tutorial-hero-in">
          <Link className="tutorial-back" href={isAdmin ? "/admin" : "/"}><ArrowLeft size={16} aria-hidden="true" /> {isAdmin ? "Kembali ke panel" : "Ke beranda"}</Link>
          <p className="tutorial-eyebrow">Tutorial superadmin</p>
          <h1>Cara mengatur website</h1>
          <p className="tutorial-lead">Assalamu&apos;alaikum, Sidi. Di sini saya tunjukkan cara mengatur website langkah demi langkah, supaya Sidi bisa mengerjakannya sendiri. Tidak perlu dibaca berurutan, langsung pilih yang sedang dibutuhkan saja.</p>
          <div className="tutorial-quick">
            {QUICK_LINKS.map((q) => (
              <a key={q.id} href={`#${q.id}`}>
                <b>{q.title}</b>
                <span>{q.text}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="tutorial-layout gutter">
        <aside className="tutorial-side">
          <TutorialNav groups={groups.map((g) => ({ title: g.title, items: g.guides.map((x) => ({ id: x.id, title: x.title })) }))} />
        </aside>
        <div className="tutorial-body">
          <p className="tutorial-legend"><span className="tutorial-legend-box" aria-hidden="true" /> Kotak merah di gambar menandai bagian yang perlu ditekan. Nama, email, dan angka pendapatan sengaja saya samarkan. Gambar bisa ditekan untuk diperbesar.</p>
          {groups.map((g, gi) => {
            const Icon = GROUP_ICONS[gi] ?? Compass;
            return (
              <section className="tutorial-group" key={g.title} aria-labelledby={`grup-${gi}`}>
                <header className="tutorial-group-head">
                  <span aria-hidden="true"><Icon size={22} /></span>
                  <div><h2 id={`grup-${gi}`}>{g.title}</h2><p>{g.text}</p></div>
                </header>
                {g.guides.map((guide) => {
                  const next = ordered[ordered.indexOf(guide) + 1];
                  return (
                    <article className="card tutorial-guide" id={guide.id} key={guide.id}>
                      <h3>{guide.title}</h3>
                      <p className="tutorial-intro">{guide.intro}</p>
                      <ol className="tutorial-steps">
                        {guide.steps.map((s) => (
                          <li key={s.text}>
                            <p>{s.text}</p>
                            {s.shot && (
                              <a className="tutorial-shot" href={withBase(`/tutorial/${s.shot}.jpg`)} target="_blank" rel="noopener noreferrer" aria-label={`Perbesar gambar: ${s.alt ?? guide.title}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={withBase(`/tutorial/${s.shot}.jpg`)} alt={s.alt ?? ""} width={800} height={528} loading="lazy" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ol>
                      {guide.note && <p className="tutorial-note"><strong>Perlu diingat:</strong> {guide.note}</p>}
                      <footer className="tutorial-guide-foot">
                        {guide.href ? <Link className="btn btn-primary sm" href={guide.href}>Buka halamannya <ArrowRight size={16} aria-hidden="true" /></Link> : <span />}
                        {next && <a className="tutorial-next" href={`#${next.id}`}><small>Berikutnya</small>{next.title}</a>}
                      </footer>
                    </article>
                  );
                })}
              </section>
            );
          })}
          <p className="tutorial-end">Kalau ada yang masih membingungkan, atau ada tampilan yang berbeda dari gambar di sini, kabari saya saja, Sidi. Semoga bermanfaat.</p>
        </div>
      </div>
    </main>
  );
}
