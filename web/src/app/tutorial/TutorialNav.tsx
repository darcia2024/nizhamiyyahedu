"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type NavGroup = { title: string; items: { id: string; title: string }[] };

/** Daftar isi: menempel di samping pada layar lebar, jadi menu lipat di atas pada HP. Bagian yang sedang dibaca ditandai. */
export function TutorialNav({ groups }: { groups: NavGroup[] }) {
  const [active, setActive] = useState(groups[0]?.items[0]?.id ?? "");
  const mobile = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const sections = groups.flatMap((g) => g.items).map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting);
      if (seen.length) setActive(seen[seen.length - 1].target.id);
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [groups]);

  const activeTitle = groups.flatMap((g) => g.items).find((i) => i.id === active)?.title;
  const list = (
    <div className="tn-list">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="tn-group">{g.title}</p>
          <ul>
            {g.items.map((i) => (
              <li key={i.id}>
                <a href={`#${i.id}`} aria-current={i.id === active ? "location" : undefined} onClick={() => { if (mobile.current) mobile.current.open = false; }}>{i.title}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
  return (
    <>
      <details className="tn-mobile" ref={mobile}>
        <summary><span><small>Daftar isi</small>{activeTitle}</span><ChevronDown size={18} aria-hidden="true" /></summary>
        <nav aria-label="Daftar isi tutorial">{list}</nav>
      </details>
      <nav className="tn-desktop" aria-label="Daftar isi tutorial">{list}</nav>
    </>
  );
}
