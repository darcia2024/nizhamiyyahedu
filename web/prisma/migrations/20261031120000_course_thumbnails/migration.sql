-- Thumbnail kelas (16:9, desain resmi) menggantikan potongan foto kitab. Hanya mengganti nilai bawaan lama,
-- jadi gambar yang sudah diunggah admin lewat editor kursus tidak tertimpa.
UPDATE "Course" SET "coverUrl" = '/kelas/thumb-ushul-fiqh.jpg'
  WHERE "slug" = 'dauroh-ushul-fiqh' AND ("coverUrl" IS NULL OR "coverUrl" = '/kelas/waraqat.jpg');
UPDATE "Course" SET "coverUrl" = '/kelas/thumb-mantiq.jpg'
  WHERE "slug" = 'dauroh-mantiq' AND ("coverUrl" IS NULL OR "coverUrl" = '/kelas/isaghuji.jpg');
