import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Check, CircleAlert, CreditCard, FileText, History, Image, Users } from "lucide-react";
import { db } from "@/lib/db";
import { rupiah, dateTimeWib } from "@/lib/format";
import { wibDayKey } from "@/lib/learning";
import { requireRole } from "@/lib/auth-guard";
import "@/styles/admin-overview.css";

const ACTIONS: Record<string,string> = {
  CONTENT_SAVE: "Memperbarui konten website", CONTENT_RESTORE: "Memulihkan versi konten", LEGAL_PUBLISH: "Menerbitkan kebijakan", COURSE_SAVE: "Menyimpan kursus", COURSE_CREATE: "Membuat kursus", COURSE_UPDATE: "Memperbarui kursus", COURSE_PUBLISH: "Menayangkan kursus", COURSE_STATUS: "Mengubah status kursus", COURSE_ARCHIVE: "Mengarsipkan kursus", COURSE_SUBMIT: "Mengajukan kursus", LESSON_SAVE: "Memperbarui pelajaran", LESSON_REORDER: "Mengurutkan pelajaran", TEACHER_SAVE: "Memperbarui profil pengajar", ROLE_CHANGE: "Mengubah peran pengguna", ACCESS_GRANT: "Memberikan akses kursus", ACCESS_REVOKE: "Menonaktifkan akses kursus", ORDER_PAID: "Memverifikasi pembayaran", PAYMENT_RECHECK: "Memeriksa pembayaran",
};
const CONTENT_LABEL: Record<string,string> = { "home.main":"Beranda", "site.copy":"Teks website & footer", "home.media":"Gambar beranda", "social.posts":"Galeri Instagram", "faq.items":"Tanya jawab", "contact.main":"Kontak" };
const CONTENT_LINK: Record<string,string> = { "home.main":"beranda", "site.copy":"bagian", "home.media":"media", "social.posts":"galeri", "faq.items":"kontak", "contact.main":"kontak" };

export async function AdminOverview({period="30"}: {period?:string}) {
  const user = await requireRole(["ADMIN"], "/admin");
  const days = ["7","30","90","all"].includes(period) ? period : "30";
  const now = new Date();
  const since = days === "all" ? new Date(0) : new Date(now.getTime() - Number(days) * 86400000);
  const [newUsers, totalStudents, activeStudents, paid, orders, courses, pending, events, logs, contents, legal, latestUsers] = await Promise.all([
    db.user.count({where:{createdAt:{gte:since}}}),
    db.user.count({where:{role:"STUDENT"}}),
    db.user.count({where:{role:"STUDENT",progress:{some:{lastOpenedAt:{gte:since}}}}}),
    db.order.findMany({where:{status:"PAID",paidAt:{gte:since}},select:{id:true,amount:true,paidAt:true,userId:true,courseId:true,createdAt:true,course:{select:{title:true,enrollments:{where:{status:"ACTIVE"},select:{userId:true}}}}}}),
    db.order.count({where:{createdAt:{gte:since}}}),
    db.course.findMany({select:{id:true,title:true,status:true,archivedAt:true,updatedAt:true,_count:{select:{lessons:true,enrollments:true}}},orderBy:{updatedAt:"desc"}}),
    db.order.count({where:{status:"PENDING",createdAt:{lt:new Date(now.getTime()-3600000)},expiresAt:{gt:now}}}),
    db.event.groupBy({by:["name"],where:{createdAt:{gte:since}},_count:true}),
    db.auditLog.findMany({where:{createdAt:{gte:since}},orderBy:{createdAt:"desc"},take:8}),
    db.siteContent.findMany({orderBy:{updatedAt:"desc"},take:6,select:{key:true,updatedAt:true}}),
    db.legalDocument.findMany({where:{publishedAt:{not:null}},orderBy:{publishedAt:"desc"},take:3,select:{slug:true,title:true,publishedAt:true}}),
    db.user.findMany({where:{createdAt:{gte:since}},orderBy:{createdAt:"desc"},take:5,select:{id:true,name:true,email:true,role:true,createdAt:true}}),
  ]);
  const published = courses.filter(c => c.status === "PUBLISHED" && !c.archivedAt);
  const drafts = courses.filter(c => c.status === "DRAFT" && !c.archivedAt);
  const revenue = paid.reduce((n,p) => n + p.amount, 0);
  const missing = paid.filter(o => !o.course.enrollments.some(e => e.userId === o.userId));
  const cohortPaid = paid.filter(p => p.createdAt >= since).length;
  const chartDays = days === "7" ? 7 : 14;
  const chart = Array.from({length:chartDays}, (_,i) => {
    const date = new Date(now.getTime() - (chartDays - i - 1) * 86400000);
    const key = wibDayKey(date);
    return { key, label: new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short"}).format(date), amount: paid.filter(o => o.paidAt && wibDayKey(o.paidAt) === key).reduce((n,o) => n + o.amount,0) };
  });
  const peak = Math.max(1, ...chart.map(d=>d.amount));
  const updates = [
    ...courses.filter(c=>c.updatedAt>=since).slice(0,5).map(c=>({title:c.title,kind:c.archivedAt?"Kursus diarsipkan":c.status==="PUBLISHED"?"Kursus tayang":"Kursus draf",at:c.updatedAt,href:`/admin/kursus/${c.id}`})),
    ...contents.filter(c=>c.updatedAt>=since).map(c=>({title:CONTENT_LABEL[c.key]??"Konten website",kind:"Konten diperbarui",at:c.updatedAt,href:`/admin/konten#${CONTENT_LINK[c.key]??"beranda"}`})),
    ...legal.filter(l=>l.publishedAt!>=since).map(l=>({title:l.title,kind:"Kebijakan diterbitkan",at:l.publishedAt!,href:"/admin/konten#legal"})),
  ].sort((a,b)=>b.at.getTime()-a.at.getTime()).slice(0,6);
  const pendingIssues = pending + missing.length + drafts.length;
  const shortcuts = [
    {href:"/admin/konten#beranda",title:"Beranda & teks",text:"Judul, penjelasan, tombol",Icon:FileText},
    {href:"/admin/kursus",title:"Kursus & pelajaran",text:"Materi, harga, dan publikasi",Icon:BookOpen},
    {href:"/admin/pengajar",title:"Profil pengajar",text:"Foto, bio, dan kelas",Icon:Users},
    {href:"/admin/konten#galeri",title:"Gambar & galeri",text:"Media beranda dan Instagram",Icon:Image},
    {href:"/admin/konten#kontak",title:"Kontak & FAQ",text:"Nomor layanan, tanya jawab",Icon:FileText},
    {href:"/admin/konten#legal",title:"Kebijakan website",text:"Privasi, syarat, refund",Icon:Check},
  ];
  return <div className="ops-home">
    <header className="ops-heading"><div><p className="ops-eyebrow">RUANG SUPERADMIN</p><h1>Ringkasan website</h1><p>Pantau pergerakan Nizhamiyyah dan kelola pembaruannya.</p></div><form><label htmlFor="period" className="sr-only">Periode ringkasan</label><select id="period" name="period" className="select" defaultValue={days}><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option><option value="90">90 hari terakhir</option><option value="all">Semua waktu</option></select><button className="btn btn-ghost sm">Terapkan</button></form></header>
    <section className="ops-banner"><div><span className="ops-eyebrow">PUSAT PENGELOLAAN</span><h2>Selamat datang, {user.name?.split(" ")[0] ?? "Superadmin"}.</h2><p>{published.length} kursus tayang · {totalStudents} siswa terdaftar. {pendingIssues ? `${pendingIssues} hal perlu kamu tinjau.` : "Tidak ada kursus draf atau pembayaran yang perlu ditinjau."}</p></div><Link className="ops-primary" href="/admin/konten">Kelola konten website <ArrowRight size={16} aria-hidden="true" /></Link></section>
    <div className="ops-stats"><article><span><Users size={17} aria-hidden="true"/>Pengguna baru</span><b data-testid="ops-new-users">{newUsers}</b><small>Dalam periode terpilih</small></article><article><span><CreditCard size={17} aria-hidden="true"/>Pemasukan kotor</span><b>{revenue ? rupiah(revenue) : "Rp 0"}</b><small>Sebelum biaya pembayaran</small></article><article><span><Activity size={17} aria-hidden="true"/>Siswa aktif belajar</span><b>{activeStudents}</b><small>Membuka pelajaran dalam periode ini</small></article><article><span><BookOpen size={17} aria-hidden="true"/>Kursus tayang</span><b>{published.length}</b><small>{drafts.length} draf · {courses.filter(c=>c.archivedAt).length} arsip</small></article></div>
    <section aria-labelledby="kelola-h"><div className="ops-section-head"><h2 id="kelola-h">Kelola seluruh konten</h2><Link href="/" target="_blank" rel="noopener noreferrer">Lihat website ↗</Link></div><div className="ops-shortcuts">{shortcuts.map(({href,title,text,Icon})=><Link key={href} href={href}><span className="ops-shortcut-icon"><Icon size={19} aria-hidden="true"/></span><span><b>{title}</b><small>{text}</small></span><ArrowRight size={15} aria-hidden="true"/></Link>)}</div></section>
    <div className="ops-grid"><section className="ops-card"><div className="ops-section-head"><h2>Perlu perhatian</h2><CircleAlert size={18} aria-hidden="true"/></div><Link className="ops-attention" href="/admin/pembayaran?status=PENDING"><b>{pending}</b><span>Tagihan menunggu lebih dari satu jam</span><ArrowRight size={15} aria-hidden="true"/></Link><Link className="ops-attention" href="/admin/pembayaran?status=PAID"><b>{missing.length}</b><span>Pembayaran lunas, akses belum aktif</span><ArrowRight size={15} aria-hidden="true"/></Link><Link className="ops-attention" href="/admin/kursus?status=DRAFT"><b>{drafts.length}</b><span>Kursus draf perlu diperiksa</span><ArrowRight size={15} aria-hidden="true"/></Link><p className="ops-note">Pemeriksaan akses lunas mengikuti periode yang dipilih.</p></section>
    <section className="ops-card"><div className="ops-section-head"><h2>Aktivitas pengunjung</h2><Activity size={18} aria-hidden="true"/></div>{["course_view","checkout_start","order_paid"].map((name,i)=><div className="ops-metric" key={name}><span>{["Detail kursus dibuka","Checkout dimulai","Pembayaran berhasil"][i]}</span><b>{events.find(e=>e.name===name)?._count??0}</b></div>)}<p className="ops-note">{cohortPaid} dari {orders} tagihan yang dibuat dalam periode ini sudah lunas ({orders?Math.round(cohortPaid/orders*100):0}%). Angka pengunjung adalah jumlah peristiwa, bukan pengunjung unik.</p></section></div>
    <div className="ops-grid"><section className="ops-card"><div className="ops-section-head"><h2>Pembayaran masuk</h2><Link href="/admin/pembayaran">Semua pembayaran <ArrowRight size={14} aria-hidden="true"/></Link></div><p className="ops-note">{chartDays} hari terakhir, dibatasi periode terpilih.</p><div className="ops-chart" role="img" aria-label="Pemasukan per hari; rincian tersedia di bawah.">{chart.map(d=><div key={d.key} title={`${d.label}: ${d.amount?rupiah(d.amount):"Rp 0"}`}><span style={{height:`${d.amount?10+(d.amount/peak)*100:3}px`}}/><small>{d.key.slice(8)}</small></div>)}</div><details><summary>Rincian pemasukan harian</summary><div className="table-box"><table className="t"><thead><tr><th>Tanggal</th><th>Pemasukan kotor</th></tr></thead><tbody>{chart.map(d=><tr key={d.key}><td>{d.label}</td><td>{d.amount?rupiah(d.amount):"Rp 0"}</td></tr>)}</tbody></table></div></details></section>
    <section className="ops-card"><div className="ops-section-head"><h2>Pembaruan konten</h2><Link href="/admin/konten">Kelola <ArrowRight size={14} aria-hidden="true"/></Link></div>{updates.length ? <div className="ops-updates">{updates.map((u,i)=><Link key={`${u.href}-${i}`} href={u.href}><span><small>{u.kind}</small><b>{u.title}</b><time dateTime={u.at.toISOString()}>{dateTimeWib(u.at)}</time></span><ArrowRight size={15} aria-hidden="true"/></Link>)}</div> : <p className="ops-empty">Belum ada pembaruan konten dalam periode ini.</p>}</section></div>
    <div className="ops-grid"><section className="ops-card"><div className="ops-section-head"><h2>Aktivitas pengelola</h2><Link href="/admin/log">Semua aktivitas <History size={14} aria-hidden="true"/></Link></div>{logs.length ? <ol className="ops-timeline">{logs.map(l=><li key={l.id}><span className="ops-timeline-dot" aria-hidden="true"/><div><b>{ACTIONS[l.action] ?? "Memperbarui pengelolaan website"}</b><p>{l.actorName ?? "Pengelola"} · {l.targetType === "SiteContent" ? CONTENT_LABEL[l.targetId] ?? "Konten website" : l.targetType === "User" ? "Pengguna" : l.targetType === "Order" ? "Pembayaran" : l.targetType === "Course" ? "Kursus" : l.targetType === "Lesson" ? "Pelajaran" : "Website"}</p><time dateTime={l.createdAt.toISOString()}>{dateTimeWib(l.createdAt)}</time></div></li>)}</ol> : <p className="ops-empty">Belum ada perubahan pengelolaan dalam periode ini.</p>}</section>
    <section className="ops-card"><div className="ops-section-head"><h2>Pengguna baru</h2><Link href="/admin/pengguna">Kelola pengguna <ArrowRight size={14} aria-hidden="true"/></Link></div>{latestUsers.length ? latestUsers.map(u=><Link className="ops-user" key={u.id} href={`/admin/pengguna/${u.id}`}><span className="ops-user-avatar" aria-hidden="true">{(u.name ?? u.email).slice(0,1).toUpperCase()}</span><span><b>{u.name ?? "Pengguna"}</b><small>{u.role==="ADMIN"?"Superadmin":u.role==="TEACHER"?"Pengajar":"Siswa"} · {dateTimeWib(u.createdAt)}</small></span><ArrowRight size={14} aria-hidden="true"/></Link>) : <p className="ops-empty">Belum ada pengguna baru dalam periode ini.</p>}</section></div>
    <p className="ops-note">Data dari database aplikasi · diperbarui saat halaman dimuat, {dateTimeWib(now)}.</p>
  </div>;
}
