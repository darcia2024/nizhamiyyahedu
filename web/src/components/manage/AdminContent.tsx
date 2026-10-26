import { ActionForm, Field } from "@/components/ActionForm";
import { NotesEditor } from "@/components/LessonEditors";
import { saveSiteContent, publishLegal } from "@/app/actions/manage";
import { getContent, getLegal, LEGAL_TITLE } from "@/lib/content";
import { db } from "@/lib/db";
import { dateTimeWib } from "@/lib/format";
import { ManageHeading } from "./ManageUI";
export async function AdminContent(){
  const [home,contact,faq]=await Promise.all([getContent("home.main"),getContent("contact.main"),getContent("faq.items")]);
  const docs=await Promise.all((["privasi","syarat","refund"] as const).map(async slug=>({slug,doc:await getLegal(slug),versions:await db.legalDocument.findMany({where:{slug},orderBy:{version:"desc"},take:10})})));
  return <><ManageHeading title="Isi website" text="Ubah informasi yang dibaca pengunjung. Perubahan langsung memperbarui halaman publik."/>
    <section className="card pad"><h2>Beranda</h2><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="home.main"/>
      <Field name="eyebrow" label="Kalimat pembuka" defaultValue={home.eyebrow} full/>
      <Field name="title" label="Judul utama" defaultValue={home.title} full/>
      <Field name="sub" label="Penjelasan utama" type="textarea" defaultValue={home.sub} full/>
      <Field name="note" label="Catatan di bawah tombol" defaultValue={home.note} full/>
      {home.steps.map((s,i)=><div className="full form-grid" key={i}><Field name={`s${i+1}t`} label={`Langkah ${i+1}: judul`} defaultValue={s.title}/><Field name={`s${i+1}d`} label="Penjelasan" defaultValue={s.text}/></div>)}
      <Field name="bandEyebrow" label="Label bagian contoh belajar" defaultValue={home.bandEyebrow}/><Field name="bandTitle" label="Judul bagian contoh" defaultValue={home.bandTitle}/><Field name="bandText" label="Penjelasan contoh" type="textarea" defaultValue={home.bandText} full/><Field name="bandAr" label="Contoh matan" type="textarea" dir="rtl" lang="ar" defaultValue={home.bandAr} full/><Field name="bandCaption" label="Terjemah dan sumber" defaultValue={home.bandCaption} full/>
    </ActionForm></section>
    <section className="card pad"><h2>Kontak pengelola</h2><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="contact.main"/><Field name="whatsapp" label="WhatsApp admin" defaultValue={contact.whatsapp} placeholder="6281234567890"/><Field name="email" label="Email" type="email" defaultValue={contact.email}/><Field name="hours" label="Jam layanan" defaultValue={contact.hours}/><Field name="address" label="Alamat" defaultValue={contact.address}/></ActionForm></section>
    <section className="card pad"><h2>Tanya jawab</h2><p className="small muted">Kosongkan pertanyaan dan jawaban untuk menghapusnya. Urutan di sini mengikuti tampilan beranda.</p><ActionForm action={saveSiteContent}><input type="hidden" name="key" value="faq.items"/>{[...faq,{q:"",a:""}].map((f,i)=><div className="full form-grid faq-admin-row" key={i}><Field name="q" index={i} label={`Pertanyaan ${i+1}`} defaultValue={f.q}/><Field name="a" index={i} label="Jawaban" type="textarea" defaultValue={f.a} rows={3}/></div>)}</ActionForm></section>
    {docs.map(({slug,doc,versions})=><section className="card pad" key={slug}><h2>{LEGAL_TITLE[slug]}</h2><p className="small muted">{doc.version?`Versi ${doc.version} sedang tayang.`:"Belum ada versi yang diterbitkan. Periksa draf sebelum menerbitkan."} Setiap penerbitan menyimpan versi baru.</p><ActionForm action={publishLegal} submit="Terbitkan versi baru"><input type="hidden" name="slug" value={slug}/><Field name="title" label="Judul halaman" defaultValue={doc.title} full/><NotesEditor initial={doc.bodyMd} name="bodyMd"/></ActionForm>{versions.length>0&&<details className="admin-disclosure"><summary>Versi terdahulu</summary>{versions.map(v=><details key={v.version}><summary>Versi {v.version} / {v.publishedAt?dateTimeWib(v.publishedAt):"Draf"}</summary><pre className="code-preview">{v.bodyMd}</pre></details>)}</details>}</section>)}
  </>;
}
