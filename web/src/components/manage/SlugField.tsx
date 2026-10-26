"use client";
import { useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/slug";
export function SlugField({initial}: {initial:string}){
  const [slug,setSlug]=useState(initial),[manual,setManual]=useState(Boolean(initial));
  const ref=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(manual)return;const title=ref.current?.form?.querySelector<HTMLInputElement>('[name="title"]');const update=()=>setSlug(slugify(title?.value??""));update();title?.addEventListener("input",update);return()=>title?.removeEventListener("input",update);},[manual]);
  return <div className="field"><label htmlFor="course-slug">Alamat halaman</label><input ref={ref} id="course-slug" className="input" name="slug" value={slug} onChange={e=>{setManual(true);setSlug(e.target.value);}} aria-describedby="slug-hint" maxLength={80}/><span id="slug-hint" className="hint">/kursus/{slug||"nama-kursus"}. Judul Arab perlu alamat Latin.</span></div>;
}
