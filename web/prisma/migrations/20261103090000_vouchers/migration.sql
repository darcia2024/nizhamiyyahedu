-- Voucher diskon persen. Hanya menambah tabel dan kolom kosong, data lama tidak berubah.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "voucherCode" TEXT,
ADD COLUMN     "voucherId" TEXT;

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "courseId" TEXT,
    "allowedEmails" TEXT,
    "maxUses" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Order_voucherId_idx" ON "Order"("voucherId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seperti tabel lain: RLS aktif tanpa kebijakan, jadi akses langsung lewat API Supabase tertutup; aplikasi memakai koneksi server.
ALTER TABLE "Voucher" ENABLE ROW LEVEL SECURITY;
