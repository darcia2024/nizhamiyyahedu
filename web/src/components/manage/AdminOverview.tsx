import Link from "next/link";
import { db } from "@/lib/db";
import { rupiah, dateWib } from "@/lib/format";
import { ManageHeading } from "./ManageUI";
export async function AdminOverview({period="30"}: {period?:string}) {
  const days=["7","30","90","all"].includes(period)?period:"30";
  const since=days==="all"?new Date(0):new Date(Date.now()-Number(days)*86400000);
  const prev=days==="all"?new Date(0):new Date(since.getTime()-Number(days)*86400000);
  const [newUsers,previousUsers,paid,orders,courses,pending,events] = await Promise.all([
    db.user.count({where:{createdAt:{gte:since}}}),db.user.count({where:{createdAt:{gte:prev,lt:since}}}),
    db.order.findMany({where:{status:"PAID",paidAt:{gte:since}},select:{amount:true,paidAt:true,userId:true,courseId:true}}),
    db.order.count({where:{createdAt:{gte:since}}}),
    db.course.findMany({include:{enrollments:true,lessons:{where:{status:"PUBLISHED"},include:{progress:{where:{completedAt:{not:null}}}}}},orderBy:{createdAt:"desc"}}),
    db.order.count({where:{status:"PENDING",createdAt:{lt:new Date(Date.now()-3600000)},expiresAt:{gt:new Date()}}}),
    db.event.groupBy({by:["name"],where:{createdAt:{gte:since}},_count:true}),
  ]);
  const revenue=paid.reduce((n,p)=>n+p.amount,0);
  const missing=paid.filter(o=>!courses.find(c=>c.id===o.courseId)?.enrollments.some(e=>e.userId===o.userId && e.status==="ACTIVE"));
  const drafts=courses.filter(c=>c.status==="DRAFT" && !c.archivedAt);
  const [submissions,inactive]=await Promise.all([
    db.auditLog.findMany({where:{action:"COURSE_SUBMIT",targetId:{in:drafts.map(c=>c.id)}},distinct:["targetId"],orderBy:{createdAt:"desc"},take:10}),
    db.user.count({where:{role:"STUDENT",createdAt:{lt:new Date(Date.now()-14*86400000)},enrollments:{some:{status:"ACTIVE"}},progress:{none:{lastOpenedAt:{gte:new Date(Date.now()-14*86400000)}}}}}),
  ]);
  const cohortPaid=await db.order.count({where:{createdAt:{gte:since},status:"PAID"}});
  const chartDays=days==="7"?7:14;
  const chart=Array.from({length:chartDays},(_,i)=>{const d=new Date(Date.now()-(chartDays-1-i)*86400000); const key=d.toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"}); return {date:d,label:d.toLocaleDateString("id-ID",{day:"numeric",month:"short",timeZone:"Asia/Jakarta"}),amount:paid.filter(o=>o.paidAt?.toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})===key).reduce((s,o)=>s+o.amount,0)};});
  const max=Math.max(1,...chart.map(d=>d.amount));
  return <><ManageHeading eyebrow="Ruang pengelola" title="Gambaran hari ini" text="Pantau kelas, pembayaran, dan aktivitas belajar dalam satu tempat.">
    <form><label className="sr-only" htmlFor="period">Periode ringkasan</label><select id="period" name="period" className="select" defaultValue={days}><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option><option value="90">90 hari terakhir</option><option value="all">Semua waktu</option></select><button className="btn btn-ghost sm">Terapkan</button></form>
  </ManageHeading>{submissions.length>0&&<section className="alert info-box"><div><b>{submissions.length} kursus diajukan pengajar</b>{submissions.map(s=><p key={s.id}><Link href={`/admin/kursus/${s.targetId}`}>{drafts.find(c=>c.id===s.targetId)?.title}</Link></p>)}</div></section>}<div className="admin-stats">
    <article className="card pad"><span className="small muted">User baru</span><strong>{newUsers}</strong><span className="small muted">{days==="all"?"Sejak website berjalan":`${newUsers-previousUsers>=0?"+":""}${newUsers-previousUsers} dibanding periode sebelumnya`}</span></article>
    <article className="card pad"><span className="small muted">Pemasukan kotor</span><strong>{revenue ? rupiah(revenue):"Rp 0"}</strong><span className="small muted">Belum dipotong biaya Mayar</span></article>
    <article className="card pad"><span className="small muted">Konversi checkout</span><strong>{orders?Math.round(cohortPaid/orders*100):0}%</strong><span className="small muted">{cohortPaid} lunas dari {orders} tagihan periode ini</span></article>
    <article className="card pad"><span className="small muted">Kelas tayang</span><strong>{courses.filter(c=>c.status==="PUBLISHED"&&!c.archivedAt).length}</strong><span className="small muted">{drafts.length} kelas dalam persiapan</span></article>
  </div><div className="admin-two"><section className="card pad"><h2>Perlu perhatian</h2><div className="attention-list">
    <Link href="/admin/pembayaran?status=PENDING"><b>{pending}</b><span>Tagihan menunggu lebih dari satu jam</span></Link>
    <Link href="/admin/pembayaran?status=PAID"><b>{missing.length}</b><span>Pembayaran lunas, akses belum aktif</span></Link>
    <Link href="/admin/kursus?status=DRAFT"><b>{drafts.length}</b><span>Kursus draf perlu diperiksa</span></Link>
  </div></section><section className="card pad"><h2>Alur pendaftaran</h2><p className="small muted">Peristiwa yang tercatat dalam periode terpilih.</p>{["course_view","checkout_start","order_paid"].map((name,i)=><div className="metric-line" key={name}><span>{["Detail kursus dibuka","Checkout dimulai","Pembayaran berhasil"][i]}</span><b>{events.find(e=>e.name===name)?._count??0}</b></div>)}</section></div>
  <section className="card pad"><h2>Pemasukan harian</h2><p className="small muted">{chartDays} hari terakhir, dalam periode terpilih. Kotor sebelum biaya penyedia pembayaran.</p>
    <div className="revenue-chart" role="img" aria-label="Grafik pemasukan harian. Rincian tersedia di tabel di bawah.">{chart.map(d=><div key={d.label} title={`${d.label}: ${d.amount}`}><span style={{height:`${Math.max(2,d.amount/max*130)}px`}}/><small>{d.date.getDate()}</small></div>)}</div>
    <details><summary>Rincian pemasukan per hari</summary><table className="t"><thead><tr><th>Tanggal</th><th>Pemasukan kotor</th></tr></thead><tbody>{chart.map(d=><tr key={d.label}><td>{d.label}</td><td>{d.amount?rupiah(d.amount):"Rp 0"}</td></tr>)}</tbody></table></details>
  </section><section className="card"><div className="sec-hd"><h2>Progres per kursus</h2><Link href="/admin/kursus">Kelola kelas</Link></div><div className="table-box"><table className="t responsive-table"><thead><tr><th>Kursus</th><th>User baru</th><th>Akses aktif</th><th>Rata-rata selesai</th></tr></thead><tbody>{courses.map(c=>{const active=c.enrollments.filter(e=>e.status==="ACTIVE");const n=c.lessons.reduce((sum,l)=>sum+l.progress.filter(p=>active.some(e=>e.userId===p.userId)).length,0);return <tr key={c.id}><td data-label="Kursus"><Link href={`/admin/kursus/${c.id}`}>{c.title}</Link></td><td data-label="User baru">{c.enrollments.filter(e=>e.createdAt>=since).length}</td><td data-label="Akses aktif">{active.length}</td><td data-label="Progres">{active.length&&c.lessons.length?Math.round(n/(active.length*c.lessons.length)*100):0}%</td></tr>;})}</tbody></table></div></section>
  <p className="small muted">{inactive} user dengan akses aktif belum membuka pelajaran selama 14 hari. Diperbarui {dateWib(new Date())}. Data berasal dari database aplikasi.</p></>;
}
