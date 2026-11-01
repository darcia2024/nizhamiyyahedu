import { db } from "@/lib/db";

export type DeleteUserResult = { ok: true; email: string; name: string | null } | { ok: false; reason: string };

/**
 * Hapus akun beserta data belajarnya, dalam satu transaksi.
 * Ditolak bila ada yang harus tetap tersimpan atau masih berjalan: riwayat pembelian, sertifikat, profil pengajar,
 * dan tagihan yang tautan Mayar-nya masih bisa dibayar (pembayarannya nanti tidak punya tagihan untuk dilunasi).
 */
export async function deleteUserAccount(actorId: string, userId: string): Promise<DeleteUserResult> {
  return db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, teacherProfile: { select: { id: true } } } });
    if (!u) return { ok: false, reason: "User tidak ditemukan." };
    if (u.id === actorId) return { ok: false, reason: "Akun sendiri tidak bisa dihapus." };
    if (u.role === "ADMIN") return { ok: false, reason: "Akun admin tidak bisa dihapus. Ubah dulu perannya." };
    if (u.teacherProfile) return { ok: false, reason: "Akun ini terhubung ke profil pengajar. Lepaskan dulu di menu Pengajar." };
    const [paid, payable, certificates] = await Promise.all([
      tx.order.count({ where: { userId, status: "PAID" } }),
      tx.order.count({ where: { userId, status: { in: ["PENDING", "CANCELLED"] }, expiresAt: { gt: new Date() } } }),
      tx.certificate.count({ where: { userId, revokedAt: null } }),
    ]);
    if (paid) return { ok: false, reason: "Sudah pernah membeli, jadi riwayat pembayarannya harus disimpan. Nonaktifkan aksesnya saja." };
    if (payable) return { ok: false, reason: "Masih ada tagihan yang tautannya bisa dibayar. Coba lagi setelah kedaluwarsa." };
    if (certificates) return { ok: false, reason: "Sudah punya sertifikat yang masih berlaku." };
    await tx.lessonProgress.deleteMany({ where: { userId } });
    await tx.lessonNote.deleteMany({ where: { userId } });
    await tx.note.deleteMany({ where: { userId } });
    await tx.enrollment.deleteMany({ where: { userId } });
    await tx.order.deleteMany({ where: { userId } });
    await tx.certificate.deleteMany({ where: { userId } });
    await tx.event.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
    return { ok: true, email: u.email, name: u.name };
  });
}
