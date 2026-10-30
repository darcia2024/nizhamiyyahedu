import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { COPY_GROUPS } from "@/lib/site-copy";
import { socialImage } from "@/lib/social";
import { ActionForm, Field, InlineAction } from "@/components/ActionForm";
import { NotesEditor } from "@/components/LessonEditors";
import { saveSiteContent, publishLegal, restoreContentVersion, saveHeroImage, saveSocialPost, removeSocialPost } from "@/app/actions/manage";
import { getContent, getLegal, LEGAL_TITLE } from "@/lib/content";
import { db } from "@/lib/db";
import { dateTimeWib } from "@/lib/format";
import { ManageHeading } from "./ManageUI";
async function ContentHistory({contentKey}:{contentKey:string}){
  const versions=await db.siteContentVersion.findMany({where:{key:contentKey},orderBy:{version:"desc"},take:10});
  if(!versions.length)return <p className="small muted">Belum ada riwayat. Versi pertama tersimpan saat kamu menyimpan perubahan.</p>;
  return <details className="admin-disclosure"><summary>Riwayat versi ({versions.length})</summary>{versions.map((v,i)=><div key={v.id} className="form-grid"><p className="small">Versi {v.version} / {dateTimeWib(v.createdAt)}{i===0?" (tayang sekarang)":""}</p>{i>0&&<ActionForm action={restoreContentVersion} submit="Pulihkan versi ini" submitClass="btn btn-ghost"><input type="hidden" name="versionId" value={v.id}/></ActionForm>}</div>)}</details>;
}
export async function AdminContent(){
  const [home,contact,faq]=await Promise.all([getContent("home.main"),getContent("contact.main"),getContent("faq.items")]);
  const docs=await Promise.all((["privasi","syarat","refund"] as const).map(async slug=>({slug,doc:await getLegal(slug),versions:await db.legalDocument.findMany({where:{slug},orderBy:{version:"desc"},take:10})})));
  return <><ManageHeading title="Konten website" text="Kelola halaman publik, media, dan kebijakan. Setiap perubahan tersimpan dengan riwayat versi."><Link className="btn btn-ghost" href="/" target="_blank">Lihat website ↗</Link></ManageHeading><nav className="content-hub" aria-label="Pusat pengelolaan konten"><a href="#beranda">Beranda</a><a href="#bagian">Teks tiap bagian</a><a href="#media">Gambar beranda</a><a href="#galeri">Galeri Instagram</a><a href="#kontak">Kontak &amp; FAQ</a><a href="#legal">Kebijakan</a><Link href="/admin/kursus">Kursus &amp; pelajaran</Link><Link href="/admin/pengajar">Profil pengajar</Link></nav>
    <section id="beranda" className="card pad"><h2>Beranda</h2><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="home.main"/>
      <Field name="eyebrow" label="Label pembuka" defaultValue={home.eyebrow} full/>
      <Field name="title" label="Judul utama (baris pertama)" defaultValue={home.title} full/>
      <Field name="sub" label="Penjelasan utama" type="textarea" defaultValue={home.sub} full/>
      <Field name="note" label="Catatan di bawah tombol" defaultValue={home.note} full/>
      {home.steps.map((s,i)=><div className="full form-grid" key={i}><Field name={`s${i+1}t`} label={`Langkah ${i+1}: judul`} defaultValue={s.title}/><Field name={`s${i+1}d`} label="Penjelasan" defaultValue={s.text}/></div>)}
      <Field name="bandEyebrow" label="Label bagian contoh belajar" defaultValue={home.bandEyebrow}/><Field name="bandTitle" label="Judul bagian contoh" defaultValue={home.bandTitle}/><Field name="bandText" label="Penjelasan contoh" type="textarea" defaultValue={home.bandText} full/><Field name="bandAr" label="Contoh matan" type="textarea" dir="rtl" lang="ar" defaultValue={home.bandAr} full/><Field name="bandCaption" label="Terjemah dan sumber" defaultValue={home.bandCaption} full/>
    </ActionForm><ContentHistory contentKey="home.main"/></section>
    <ExtraWebsiteContent/><section id="kontak" className="card pad"><h2>Kontak pengelola</h2><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="contact.main"/><Field name="whatsapp" label="WhatsApp admin" defaultValue={contact.whatsapp} placeholder="6281234567890"/><Field name="email" label="Email" type="email" defaultValue={contact.email}/><Field name="hours" label="Jam layanan" defaultValue={contact.hours}/><Field name="address" label="Alamat" defaultValue={contact.address}/></ActionForm><ContentHistory contentKey="contact.main"/></section>
    <section className="card pad"><h2>Tanya jawab</h2><p className="small muted">Kosongkan pertanyaan dan jawaban untuk menghapusnya. Urutan di sini mengikuti tampilan beranda.</p><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="faq.items"/>{[...faq,{q:"",a:""}].map((f,i)=><div className="full form-grid faq-admin-row" key={i}><Field name="q" index={i} label={`Pertanyaan ${i+1}`} defaultValue={f.q}/><Field name="a" index={i} label="Jawaban" type="textarea" defaultValue={f.a} rows={3}/></div>)}</ActionForm><ContentHistory contentKey="faq.items"/></section>
    {docs.map(({slug,doc,versions})=><section id={slug === "privasi" ? "legal" : undefined} className="card pad" key={slug}><h2>{LEGAL_TITLE[slug]}</h2><p className="small muted">{doc.version?`Versi ${doc.version} sedang tayang.`:"Belum ada versi yang diterbitkan. Periksa draf sebelum menerbitkan."} Setiap penerbitan menyimpan versi baru.</p><ActionForm action={publishLegal} submit="Terbitkan versi baru"><input type="hidden" name="slug" value={slug}/><Field name="title" label="Judul halaman" defaultValue={doc.title} full/><NotesEditor initial={doc.bodyMd} name="bodyMd"/></ActionForm>{versions.length>0&&<details className="admin-disclosure"><summary>Versi terdahulu</summary>{versions.map(v=><details key={v.version}><summary>Versi {v.version} / {v.publishedAt?dateTimeWib(v.publishedAt):"Draf"}</summary><pre className="code-preview">{v.bodyMd}</pre></details>)}</details>}</section>)}
  </>;
}


async function ExtraWebsiteContent() {
  const [copy, media, posts] = await Promise.all([getContent("site.copy"), getContent("home.media"), getContent("social.posts")]);
  return <>
    <section id="bagian" className="card pad"><h2>Teks tiap bagian &amp; footer</h2><p className="small muted">Judul, penjelasan, tombol, dan akun Instagram yang tampil di website.</p>
      <ActionForm action={saveSiteContent} submit="Simpan teks website"><input type="hidden" name="key" value="site.copy"/>
        {COPY_GROUPS.map(group => <details className="full content-fields" key={group.title}><summary>{group.title}</summary><div className="form-grid">{group.fields.map(f => <Field key={f.key} name={f.key} label={f.label} type={f.key.endsWith("Text") || f.key.startsWith("footer") ? "textarea" : "text"} defaultValue={copy[f.key]} maxLength={600} full />)}</div></details>)}
      </ActionForm><ContentHistory contentKey="site.copy"/>
    </section>
    <section id="media" className="card pad"><h2>Gambar beranda</h2><p className="small muted">Ganti gambar mockup desktop dan HP. JPG, PNG, atau WebP, maksimal 5 MB. Proporsi gambar tetap dipertahankan.</p>
      <div className="admin-two">{(["desktop","mobile"] as const).map(slot => <div key={slot}><h3>{slot === "desktop" ? "Desktop" : "HP"}</h3><img src={withBase(media[slot === "desktop" ? "desktopImage" : "mobileImage"])} alt={media[slot === "desktop" ? "desktopAlt" : "mobileAlt"]} className="content-image"/><ActionForm action={saveHeroImage} submit="Simpan gambar"><input type="hidden" name="slot" value={slot}/><label className="field full">Gambar baru<input className="input" type="file" name="image" accept="image/jpeg,image/png,image/webp"/></label><Field name="alt" label="Deskripsi gambar" defaultValue={media[slot === "desktop" ? "desktopAlt" : "mobileAlt"]} maxLength={250} full/></ActionForm></div>)}</div><ContentHistory contentKey="home.media"/>
    </section>
    <section id="galeri" className="card pad"><h2>Galeri Instagram</h2><p className="small muted">Tambah, ganti gambar, edit deskripsi, atau hapus postingan dari beranda. Maksimal 24 postingan.</p>
      <details className="admin-disclosure"><summary>Tambah postingan</summary><SocialPostForm/></details>
      {posts.map(post => <details className="admin-disclosure" key={post.code}><summary>{post.alt}</summary><div className="content-post"><img className="content-image" src={withBase(post.image ?? socialImage(post.code))} alt={post.alt}/><div><SocialPostForm post={post}/><InlineAction action={removeSocialPost} fields={{code:post.code}} label="Hapus dari galeri" className="btn btn-ghost sm"/></div></div></details>)}
      <ContentHistory contentKey="social.posts"/>
    </section>
  </>;
}
function SocialPostForm({post}:{post?:{code:string;date:string;alt:string;image?:string}}) {
  return <ActionForm action={saveSocialPost} submit={post ? "Simpan postingan" : "Tambah postingan"}>
    {post ? <input type="hidden" name="code" value={post.code}/> : <Field name="code" label="Kode postingan Instagram" hint="Bagian kode pada alamat instagram.com/p/kode/." maxLength={80} full/>}
    <Field name="date" label="Tanggal atau label publikasi" defaultValue={post?.date} maxLength={80} full/><Field name="alt" label="Deskripsi postingan" defaultValue={post?.alt} type="textarea" maxLength={250} full/>
    <label className="field full">{post ? "Ganti gambar (opsional)" : "Gambar postingan"}<input className="input" type="file" name="image" accept="image/jpeg,image/png,image/webp"/><span className="hint">JPG, PNG, WebP. Maksimal 5 MB.</span></label>
  </ActionForm>;
}
