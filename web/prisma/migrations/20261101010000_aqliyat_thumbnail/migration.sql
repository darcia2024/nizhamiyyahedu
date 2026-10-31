-- Dauroh Aqliyat (paket) punya thumbnail sendiri; sebelumnya kartunya menumpuk thumbnail dua kelas isinya.
-- Hanya mengisi bila masih kosong, jadi gambar yang diunggah admin tidak tertimpa.
UPDATE "Course" SET "coverUrl" = '/kelas/thumb-aqliyat.jpg' WHERE "slug" = 'dauroh-aqliyat' AND "coverUrl" IS NULL;