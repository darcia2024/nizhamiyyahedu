-- Semua pelajaran berbayar: cabut tanda pratinjau gratis dari data yang ada.
UPDATE "Lesson" SET "isFreePreview" = false WHERE "isFreePreview" = true;
