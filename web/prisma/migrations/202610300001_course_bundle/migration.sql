-- Paket bundling: satu pembelian membuka beberapa kursus.
ALTER TABLE "Course" ADD COLUMN "bundleCourseIds" TEXT;
