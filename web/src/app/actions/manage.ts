"use server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, fromZod, formObject, type ActionResult } from "@/lib/action";
import { canManageCourse, getCurrentUser, type CurrentUser } from "@/lib/auth-guard";
import { courseSchema, lessonSchema, roleSchema, teacherSchema } from "@/lib/validators";
import { fetchTransaction, mayarSimulated } from "@/lib/mayar";
import { settleOrder } from "@/lib/orders";
import { saveContent, DEFAULTS, type ContentKey } from "@/lib/content";
import { saveTeacherPhoto } from "@/lib/media";

type Guard = { ok: true; user: CurrentUser } | { ok: false; result: ActionResult };

async function asAdmin(): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { ok: false, result: fail("Hanya admin yang boleh melakukan ini.") };
  return { ok: true, user };
}
async function asManager(courseId: string): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user || !(await canManageCourse(user, courseId))) return { ok: false, result: fail("Anda tidak punya akses ke kursus ini.") };
  return { ok: true, user };
}

function refreshCourse(slug?: string) {
  revalidateTag("catalog");
  revalidateTag("home");
  revalidatePath("/kursus");
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard/kelola", "page");
  if (slug) revalidatePath(`/kursus/${slug}`);
}
const editPath = (user: CurrentUser, id: string) => (user.role === "ADMIN" ? `/admin/kursus/${id}` : `/dashboard/kelola/${id}`);

// ---------------- kursus ----------------

export async function saveCourse(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const raw = formObject(fd);
  const id = String(raw.id ?? "");
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) return fail("Anda tidak punya akses.");
  if (id) {
    const g = await asManager(id);
    if (!g.ok) return g.result;
  }
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const clash = await db.course.findFirst({ where: { slug: d.slug, NOT: id ? { id } : undefined }, select: { id: true } });
  if (clash) return fail("Alamat halaman sudah dipakai kursus lain.", { slug: "Alamat halaman sudah dipakai kursus lain." });

  const isAdmin = user.role === "ADMIN";
  let teacherId: string | null | undefined;
  if (isAdmin) teacherId = d.teacherId || null;
  else teacherId = (await db.teacherProfile.findUnique({ where: { userId: user.id }, select: { id: true } }))?.id;
  if(!isAdmin && !teacherId) return fail("Profil pengajar Anda belum ditautkan. Hubungi admin sebelum membuat kursus.");

  const data = {
    title: d.title, titleAr: d.titleAr || null, slug: d.slug, field: d.field, level: d.level, description: d.description,
    ...(isAdmin ? { priceRupiah: d.priceRupiah ?? 0, sortOrder: d.sortOrder ?? 0 } : {}),
    ...(teacherId !== undefined ? { teacherId } : {}),
  };

  if (!id) {
    const c = await db.course.create({ data: { ...data, status: "DRAFT", createdById: user.id } });
    await audit(user, "COURSE_CREATE", "Course", c.id, { after: { title: c.title, slug: c.slug } });
    refreshCourse();
    redirect(editPath(user, c.id));
  }

  const before = await db.course.findUnique({ where: { id } });
  await db.course.update({ where: { id }, data });
  if (isAdmin && before && before.priceRupiah !== (d.priceRupiah ?? 0)) {
    await audit(user, "COURSE_PRICE", "Course", id, { before: before.priceRupiah, after: d.priceRupiah ?? 0 });
  }
  refreshCourse(d.slug);
  if (before && before.slug !== d.slug) revalidatePath(`/kursus/${before.slug}`);
  return { ok: true, message: "Tersimpan." };
}

export async function setCourseStatus(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = String(fd.get("id") ?? "");
  const to = String(fd.get("to") ?? "");
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const c = await db.course.findUnique({ where: { id }, include: { lessons: { where: { status: "PUBLISHED" }, select: { id: true } } } });
  if (!c) return fail("Kursus tidak ditemukan.");
  if (to === "PUBLISHED") {
    const missing: string[] = [];
    if (c.lessons.length < 1) missing.push("minimal 1 pelajaran berstatus Tayang");
    if (!c.teacherId) missing.push("pengajar belum dipilih");
    if (c.archivedAt) missing.push("kursus masih diarsipkan");
    if (missing.length) return fail(`Belum bisa ditayangkan: ${missing.join(", ")}.`);
  }
  if (to !== "PUBLISHED" && to !== "DRAFT") return fail("Status tidak dikenal.");
  await db.course.update({ where: { id }, data: { status: to } });
  await audit(g.user, "COURSE_STATUS", "Course", id, { before: c.status, after: to });
  refreshCourse(c.slug);
  return { ok: true, message: to === "PUBLISHED" ? "Kursus ditayangkan." : "Kursus dikembalikan ke draf." };
}

export async function archiveCourse(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = String(fd.get("id") ?? "");
  const restore = fd.get("restore") === "1";
  const g = await asManager(id);
  if (!g.ok) return g.result;
  const c = await db.course.findUnique({ where: { id } });
  if (!c) return fail("Kursus tidak ditemukan.");
  if (!restore) {
    if (String(fd.get("confirm") ?? "").trim() !== c.title) return fail("Ketik judul kursus persis sama untuk mengonfirmasi.", { confirm: "Judul tidak cocok." });
    if (g.user.role !== "ADMIN") {
      const paid = await db.order.count({ where: { courseId: id, status: "PAID" } });
      if (paid > 0) return fail("Kursus ini punya pembeli. Hubungi admin untuk mengarsipkannya.");
    }
  }
  await db.course.update({ where: { id }, data: { archivedAt: restore ? null : new Date() } });
  await audit(g.user, restore ? "COURSE_RESTORE" : "COURSE_ARCHIVE", "Course", id, { before: c.archivedAt, after: restore ? null : "archived" });
  refreshCourse(c.slug);
  return { ok: true, message: restore ? "Kursus dipulihkan." : "Kursus diarsipkan. User yang sudah terdaftar tetap bisa belajar." };
}

/** Hapus permanen: hanya admin, hanya kursus terarsip, tanpa order PAID dan tanpa pendaftar berbayar (PRD 10.4). */
export async function deleteCourse(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = String(fd.get("id") ?? "");
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const c = await db.course.findUnique({ where: { id } });
  if (!c) return fail("Kursus tidak ditemukan.");
  if (!c.archivedAt) return fail("Arsipkan kursus dulu sebelum menghapus permanen.");
  if (String(fd.get("confirm") ?? "").trim() !== c.title) return fail("Ketik judul kursus persis sama untuk mengonfirmasi.", { confirm: "Judul tidak cocok." });
  const [paid, paidEnr] = await Promise.all([
    db.order.count({ where: { courseId: id, status: "PAID" } }),
    db.enrollment.count({ where: { courseId: id, source: "PAID" } }),
  ]);
  if (paid > 0 || paidEnr > 0) return fail("Kursus ini punya pembeli berbayar sehingga tidak bisa dihapus permanen. Biarkan tetap diarsipkan.");
  await db.$transaction([
    db.lessonProgress.deleteMany({ where: { lesson: { courseId: id } } }),
    db.lesson.deleteMany({ where: { courseId: id } }),
    db.enrollment.deleteMany({ where: { courseId: id } }),
    db.order.deleteMany({ where: { courseId: id } }),
    db.course.delete({ where: { id } }),
  ]);
  await audit(g.user, "COURSE_DELETE", "Course", id, { before: { title: c.title, slug: c.slug } });
  refreshCourse(c.slug);
  redirect("/admin/kursus");
}

// ---------------- pelajaran ----------------

export async function saveLesson(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const raw = formObject(fd);
  const courseId = String(raw.courseId ?? "");
  const lessonId = String(raw.lessonId ?? "");
  const g = await asManager(courseId);
  if (!g.ok) return g.result;
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  const data = {
    title: d.title,
    durationMin: d.durationMin ?? null,
    videoUrl: d.videoUrl || null,
    matan: d.matanJson.length ? JSON.stringify(d.matanJson) : null,
    notesMd: d.notesMd || null,
  };
  const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  if (!lessonId) {
    const last = await db.lesson.aggregate({ where: { courseId }, _max: { position: true } });
    const l = await db.lesson.create({ data: { ...data, courseId, position: (last._max.position ?? 0) + 1, status: "DRAFT" } });
    refreshCourse(course?.slug);
    redirect(`${editPath(g.user, courseId)}/pelajaran/${l.id}`);
  }
  await db.lesson.update({ where: { id: lessonId, courseId }, data });
  refreshCourse(course?.slug);
  return { ok: true, message: "Pelajaran tersimpan." };
}

export async function setLessonFlags(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const courseId = String(fd.get("courseId") ?? "");
  const lessonId = String(fd.get("lessonId") ?? "");
  const g = await asManager(courseId);
  if (!g.ok) return g.result;
  const l = await db.lesson.findFirst({ where: { id: lessonId, courseId } });
  if (!l) return fail("Pelajaran tidak ditemukan.");
  const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  const status = fd.get("status");
  const preview = fd.get("preview");
  if (status === "PUBLISHED" || status === "DRAFT") {
    if (status === "PUBLISHED" && !l.title) return fail("Judul pelajaran kosong.");
    await db.lesson.update({ where: { id: lessonId }, data: { status } });
  }
  if (preview === "1") {
    await db.$transaction([
      db.lesson.updateMany({ where: { courseId }, data: { isFreePreview: false } }),
      db.lesson.update({ where: { id: lessonId }, data: { isFreePreview: true } }),
    ]);
  } else if (preview === "0") {
    await db.lesson.update({ where: { id: lessonId }, data: { isFreePreview: false } });
  }
  refreshCourse(course?.slug);
  return { ok: true };
}

/** Tukar posisi dua pelajaran bersebelahan dalam satu transaksi (hindari bentrok unique courseId+position). */
export async function moveLesson(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const courseId = String(fd.get("courseId") ?? "");
  const lessonId = String(fd.get("lessonId") ?? "");
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const g = await asManager(courseId);
  if (!g.ok) return g.result;
  const list = await db.lesson.findMany({ where: { courseId }, orderBy: { position: "asc" }, select: { id: true, position: true } });
  const i = list.findIndex((l) => l.id === lessonId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  const a = list[i], b = list[j];
  await db.$transaction([
    db.lesson.update({ where: { id: a.id }, data: { position: -1 } }),
    db.lesson.update({ where: { id: b.id }, data: { position: a.position } }),
    db.lesson.update({ where: { id: a.id }, data: { position: b.position } }),
  ]);
  const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  refreshCourse(course?.slug);
  return { ok: true };
}

export async function deleteLesson(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const courseId = String(fd.get("courseId") ?? "");
  const lessonId = String(fd.get("lessonId") ?? "");
  const g = await asManager(courseId);
  if (!g.ok) return g.result;
  const done = await db.lessonProgress.count({ where: { lessonId } });
  if (done > 0) return fail("Pelajaran ini sudah punya progres user. Ubah ke Draf saja agar progres tidak hilang.");
  await db.lesson.delete({ where: { id: lessonId, courseId } });
  const rest = await db.lesson.findMany({ where: { courseId }, orderBy: { position: "asc" }, select: { id: true } });
  for (let k = 0; k < rest.length; k++) await db.lesson.update({ where: { id: rest[k].id }, data: { position: 10_000 + k } });
  for (let k = 0; k < rest.length; k++) await db.lesson.update({ where: { id: rest[k].id }, data: { position: k + 1 } });
  const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  refreshCourse(course?.slug);
  return { ok: true, message: "Pelajaran dihapus." };
}

// ---------------- pengajar ----------------

export async function saveTeacher(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const raw = formObject(fd);
  const id = String(raw.id ?? "");
  const parsed = teacherSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  let userId: string | null = null;
  if (d.userEmail) {
    const u = await db.user.findUnique({ where: { email: d.userEmail } });
    if (!u) return fail("Email itu belum terdaftar sebagai pengguna. Minta yang bersangkutan masuk dulu.", { userEmail: "Pengguna tidak ditemukan." });
    userId = u.id;
    const used = await db.teacherProfile.findFirst({ where: { userId, NOT: id ? { id } : undefined } });
    if (used) return fail("Akun itu sudah terhubung ke profil pengajar lain.", { userEmail: "Sudah terhubung." });
  }
  let photoUrl: string | undefined;
  const photo=fd.get("photo");
  if(photo instanceof File && photo.size>0){
    const saved=await saveTeacherPhoto(photo);
    if(!saved.ok)return fail(saved.error,{photo:saved.error});
    photoUrl=saved.url;
  }
  const data = { displayName: d.displayName, bio: d.bio, alumni: d.alumni || null, sanad: d.sanad || null, userId, showOnHome: fd.get("showOnHome") === "on", ...(photoUrl?{photoUrl}:{}) };
  if (id) await db.teacherProfile.update({ where: { id }, data });
  else await db.teacherProfile.create({ data });
  if (userId) {
    const u = await db.user.findUnique({ where: { id: userId } });
    if (u && u.role === "STUDENT") {
      await db.user.update({ where: { id: userId }, data: { role: "TEACHER" } });
      await audit(g.user, "ROLE_CHANGE", "User", userId, { before: "STUDENT", after: "TEACHER" });
    }
  }
  revalidateTag("home");
  refreshCourse();
  await audit(g.user,"TEACHER_SAVE","TeacherProfile",id||d.displayName);
  return { ok: true, message: "Profil pengajar tersimpan." };
}

export async function deleteTeacher(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const id = String(fd.get("id") ?? "");
  const n = await db.course.count({ where: { teacherId: id } });
  if (n > 0) return fail("Pengajar ini masih mengajar kursus. Pindahkan kursusnya dulu.");
  await db.teacherProfile.delete({ where: { id } });
  await audit(g.user,"TEACHER_DELETE","TeacherProfile",id);
  revalidateTag("home");
  return { ok: true, message: "Pengajar dihapus." };
}

// ---------------- pengguna ----------------

export async function changeRole(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const userId = String(fd.get("userId") ?? "");
  const role = roleSchema.safeParse(fd.get("role"));
  const reason = String(fd.get("reason") ?? "").trim();
  if (!role.success) return fail("Peran tidak dikenal.");
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) return fail("Pengguna tidak ditemukan.");
  if (u.role === role.data) return { ok: true, message: "Peran tidak berubah." };
  if (u.id === g.user.id) return fail("Anda tidak bisa mengubah peran akun sendiri.");
  if (fd.get("confirm") !== "on") return fail("Centang konfirmasi untuk melanjutkan.", { confirm: "Wajib dicentang." });
  if ((u.role === "ADMIN" || role.data === "ADMIN") && reason.length < 3) return fail("Perubahan ke atau dari Admin wajib disertai alasan.", { reason: "Alasan wajib diisi." });
  const result = await db.$transaction(async tx=>{
    const [actor,target]=await Promise.all([tx.user.findUnique({where:{id:g.user.id}}),tx.user.findUnique({where:{id:userId}})]);
    if(actor?.role!=="ADMIN"||!target)return fail("Hak akses telah berubah. Muat ulang halaman.");
    if((target.role==="ADMIN"||role.data==="ADMIN")&&reason.length<3)return fail("Alasan wajib diisi.");
    if(target.role==="ADMIN"&&(await tx.user.count({where:{role:"ADMIN"}}))<=1)return fail("Harus ada minimal satu admin.");
    await tx.user.update({where:{id:userId},data:{role:role.data}});
    await tx.auditLog.create({data:{actorId:g.user.id,actorName:g.user.name??g.user.email,action:"ROLE_CHANGE",targetType:"User",targetId:userId,before:JSON.stringify(target.role),after:JSON.stringify(role.data),reason:reason||null}});
    return {ok:true} as const;
  });
  if(!result.ok)return result;
  revalidatePath("/admin/pengguna");
  return { ok: true, message: `Peran ${u.name ?? u.email} diubah menjadi ${role.data}.` };
}

export async function grantAccess(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const userId = String(fd.get("userId") ?? "");
  const courseId = String(fd.get("courseId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (!courseId) return fail("Pilih kursus.", { courseId: "Pilih kursus." });
  if (reason.length < 3) return fail("Alasan wajib diisi.", { reason: "Alasan wajib diisi." });
  const [targetUser,targetCourse]=await Promise.all([db.user.findUnique({where:{id:userId},select:{id:true}}),db.course.findUnique({where:{id:courseId},select:{id:true}})]);
  if(!targetUser||!targetCourse)return fail("User atau kursus tidak ditemukan.");
  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { status: "ACTIVE" },
    create: { userId, courseId, status: "ACTIVE", source: "MANUAL" },
  });
  await audit(g.user, "ACCESS_GRANT", "User", userId, { after: { courseId }, reason });
  revalidatePath(`/admin/pengguna/${userId}`);
  return { ok: true, message: "Akses kursus dibuka." };
}

export async function revokeAccess(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const enrollmentId = String(fd.get("enrollmentId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 3) return fail("Alasan wajib diisi.", { reason: "Alasan wajib diisi." });
  const e = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!e) return fail("Pendaftaran tidak ditemukan.");
  await db.enrollment.update({ where: { id: enrollmentId }, data: { status: "REVOKED" } });
  await audit(g.user, "ACCESS_REVOKE", "User", e.userId, { before: { courseId: e.courseId, status: e.status }, after: { status: "REVOKED" }, reason });
  revalidatePath(`/admin/pengguna/${e.userId}`);
  return { ok: true, message: "Akses kursus dicabut." };
}

// ---------------- pembayaran ----------------

export async function recheckOrder(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const id = String(fd.get("orderId") ?? "");
  const o = await db.order.findUnique({ where: { id } });
  if (!o) return fail("Order tidak ditemukan.");
  if (mayarSimulated() || !o.mayarId) return fail("Mode simulasi: tidak ada Mayar untuk ditanya. Gunakan Buka akses manual bila perlu.");
  const tx = await fetchTransaction(o.mayarId);
  if (!tx) return fail("Mayar tidak memberi jawaban. Coba lagi nanti.");
  if (tx.status === "PAID" && tx.currency === "IDR" && (!tx.orderId || tx.orderId === o.id)) {
    const r = await settleOrder(o.id, tx.amount);
    await audit(g.user, "ORDER_RECHECK", "Order", id, { after: r });
    revalidatePath(`/admin/pembayaran/${id}`);
    if(r === "amount_mismatch") return fail("Nominal dari Mayar tidak cocok dengan order.");
    if(r === "cancelled" || r === "not_found") return fail("Tagihan tidak dapat dilunasi pada status sekarang.");
    return { ok: true, message: r === "already" ? "Pembayaran telah diproses. Periksa akses user bila perlu." : "Mayar mengonfirmasi lunas. Akses dibuka." };
  }
  if (o.status === "PENDING" && (tx.status === "FAILED" || tx.status === "EXPIRED")) await db.order.update({ where: { id }, data: { status: tx.status } });
  revalidatePath(`/admin/pembayaran/${id}`);
  return { ok: true, message: `Status di Mayar: ${tx.status}.` };
}

export async function manualGrantOrder(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const id = String(fd.get("orderId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 3) return fail("Alasan wajib diisi.", { reason: "Alasan wajib diisi." });
  const o = await db.order.findUnique({ where: { id } });
  if (!o) return fail("Order tidak ditemukan.");
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: o.userId, courseId: o.courseId } },
    update: { status: "ACTIVE" },
    create: { userId: o.userId, courseId: o.courseId, source: "MANUAL" },
  });
  await db.order.update({ where: { id }, data: { note: `Akses dibuka manual: ${reason}` } });
  await audit(g.user, "ORDER_MANUAL_GRANT", "Order", id, { after: { userId: o.userId, courseId: o.courseId }, reason });
  revalidatePath(`/admin/pembayaran/${id}`);
  return { ok: true, message: "Akses dibuka secara manual." };
}

export async function saveOrderNote(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const id=String(fd.get("orderId")??"");
  const existing=await db.order.findUnique({where:{id}});
  if(!existing)return fail("Tagihan tidak ditemukan.");
  await db.order.update({ where: { id }, data: { note: note || null } });
  await audit(g.user,"ORDER_NOTE","Order",id,{before:existing.note,after:note||null});
  revalidatePath(`/admin/pembayaran/${id}`);
  return { ok: true, message: "Catatan tersimpan." };
}

export async function requestPublication(_p:ActionResult,fd:FormData):Promise<ActionResult>{
  const id=String(fd.get("id")??"");const guard=await asManager(id);if(!guard.ok)return guard.result;
  const c=await db.course.findUnique({where:{id},include:{lessons:{where:{status:"PUBLISHED"}}}});
  if(!c||c.status!=="DRAFT"||c.archivedAt)return fail("Hanya kursus draf yang bisa diajukan.");
  if(!c.lessons.length)return fail("Tayangkan minimal satu pelajaran sebelum mengajukan kursus.");
  await audit(guard.user,"COURSE_SUBMIT","Course",id,{after:{title:c.title}});
  revalidatePath("/admin");return {ok:true,message:"Kursus diajukan. Admin dapat memeriksanya dari Ringkasan."};
}

export async function reorderLessons(_p:ActionResult,fd:FormData):Promise<ActionResult>{
  const courseId=String(fd.get("courseId")??"");const guard=await asManager(courseId);if(!guard.ok)return guard.result;
  let ids:unknown;try{ids=JSON.parse(String(fd.get("ids")??""));}catch{return fail("Urutan tidak valid.");}
  if(!Array.isArray(ids)||!ids.every(id=>typeof id==="string")||new Set(ids).size!==ids.length)return fail("Urutan tidak valid.");
  const requested=ids as string[];
  const current=await db.lesson.findMany({where:{courseId},select:{id:true}});
  if(current.length!==requested.length||current.some(l=>!requested.includes(l.id)))return fail("Daftar pelajaran sudah berubah. Muat ulang halaman.");
  await db.$transaction(async tx=>{
    for(let i=0;i<requested.length;i++)await tx.lesson.update({where:{id:requested[i],courseId},data:{position:-10000-i}});
    for(let i=0;i<requested.length;i++)await tx.lesson.update({where:{id:requested[i],courseId},data:{position:i+1}});
    await tx.auditLog.create({data:{actorId:guard.user.id,actorName:guard.user.name,action:"LESSON_REORDER",targetType:"Course",targetId:courseId,after:JSON.stringify(requested)}});
  });
  const course=await db.course.findUnique({where:{id:courseId},select:{slug:true}});refreshCourse(course?.slug);
  return {ok:true,message:"Urutan pelajaran tersimpan."};
}

// ---------------- isi website ----------------

export async function saveSiteContent(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const key = String(fd.get("key") ?? "") as ContentKey;
  const s = (k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
  if (key === "home.main") {
    const steps = [1, 2, 3].map((n) => ({ title: s(`s${n}t`, 80), text: s(`s${n}d`, 300) }));
    if (!s("title")) return fail("Judul beranda wajib diisi.", { title: "Wajib diisi." });
    await saveContent(key, { eyebrow: s("eyebrow", 120), title: s("title", 160), sub: s("sub", 400), note: s("note", 300), steps,
      bandEyebrow: s("bandEyebrow", 80), bandTitle: s("bandTitle", 160), bandText: s("bandText", 400), bandAr: s("bandAr", 400), bandCaption: s("bandCaption", 400) }, g.user.id);
  } else if (key === "contact.main") {
    await saveContent(key, { whatsapp: s("whatsapp", 40), email: s("email", 120), hours: s("hours", 120), address: s("address", 300) }, g.user.id);
    revalidatePath("/kontak");
  } else if (key === "faq.items") {
    const qs = fd.getAll("q").map((v) => String(v).trim().slice(0, 200));
    const as = fd.getAll("a").map((v) => String(v).trim().slice(0, 1000));
    const items = qs.map((q, i) => ({ q, a: as[i] ?? "" })).filter((x) => x.q && x.a);
    await saveContent(key, items, g.user.id);
  } else return fail("Bagian tidak dikenal.");
  await audit(g.user, "CONTENT_SAVE", "SiteContent", key);
  return { ok: true, message: "Tersimpan. Halaman publik diperbarui." };
}

/** Pulihkan isi website ke salah satu versi lama. Pemulihan disimpan sebagai versi baru, riwayat tidak dihapus. */
export async function restoreContentVersion(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const v = await db.siteContentVersion.findUnique({ where: { id: String(fd.get("versionId") ?? "") } });
  if (!v || !(v.key in DEFAULTS)) return fail("Versi tidak ditemukan.");
  let value: unknown;
  try { value = JSON.parse(v.value); } catch { return fail("Isi versi ini rusak dan tidak bisa dipulihkan."); }
  await saveContent(v.key as ContentKey, value, g.user.id);
  if (v.key === "contact.main") revalidatePath("/kontak");
  await audit(g.user, "CONTENT_RESTORE", "SiteContent", v.key, { after: { fromVersion: v.version } });
  return { ok: true, message: `Versi ${v.version} dipulihkan sebagai versi terbaru.` };
}

export async function publishLegal(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const g = await asAdmin();
  if (!g.ok) return g.result;
  const slug = String(fd.get("slug") ?? "");
  if (!["privasi", "syarat", "refund"].includes(slug)) return fail("Dokumen tidak dikenal.");
  const bodyMd = String(fd.get("bodyMd") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim().slice(0, 120);
  if (bodyMd.length < 20) return fail("Isi dokumen terlalu pendek.", { bodyMd: "Isi terlalu pendek." });
  if (bodyMd.length > 60_000) return fail("Isi dokumen terlalu panjang.", { bodyMd: "Maksimal 60.000 karakter." });
  const last = await db.legalDocument.aggregate({ where: { slug }, _max: { version: true } });
  await db.legalDocument.create({ data: { slug, version: (last._max.version ?? 0) + 1, title, bodyMd, publishedAt: new Date(), updatedBy: g.user.id } });
  await audit(g.user, "LEGAL_PUBLISH", "LegalDocument", slug, { after: { version: (last._max.version ?? 0) + 1 } });
  revalidatePath(`/${slug}`);
  return { ok: true, message: `Versi ${(last._max.version ?? 0) + 1} diterbitkan.` };
}
