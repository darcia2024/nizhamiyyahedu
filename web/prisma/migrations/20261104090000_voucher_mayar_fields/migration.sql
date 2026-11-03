-- Isian voucher mengikuti form diskon Mayar. Hanya menambah kolom, data lama tidak berubah.

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "amountOff" INTEGER,
ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "minPurchase" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "singleUse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startsAt" TIMESTAMP(3);

