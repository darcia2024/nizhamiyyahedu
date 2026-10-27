import { describe, expect, it } from "vitest";
import { activityByDay, certificateNo, courseFinished, normalizeNote, streakDays, whatsappLink, wibDayKey } from "@/lib/learning";

const at = (iso: string) => new Date(iso);

describe("catatan", () => {
  it("merapikan spasi, baris baru, dan karakter kontrol", () => {
    expect(normalizeNote("  halo\r\ndunia\u0007  ")).toBe("halo\ndunia");
  });
  it("catatan kosong menjadi string kosong", () => {
    expect(normalizeNote("   \n ")).toBe("");
  });
});

describe("hari beruntun belajar", () => {
  it("memakai hari WIB, bukan UTC", () => {
    // 20:00 UTC tanggal 26 = 03:00 WIB tanggal 27
    expect(wibDayKey(at("2026-10-26T20:00:00Z"))).toBe("2026-10-27");
  });
  it("menghitung hari berturut-turut sampai hari ini", () => {
    const now = at("2026-10-27T05:00:00Z");
    const dates = [at("2026-10-27T01:00:00Z"), at("2026-10-26T10:00:00Z"), at("2026-10-25T10:00:00Z")];
    expect(streakDays(dates, now)).toBe(3);
  });
  it("tetap lanjut bila hari ini belum belajar tapi kemarin sudah", () => {
    const now = at("2026-10-27T05:00:00Z");
    expect(streakDays([at("2026-10-26T10:00:00Z"), at("2026-10-25T10:00:00Z")], now)).toBe(2);
  });
  it("putus bila ada hari yang terlewat", () => {
    const now = at("2026-10-27T05:00:00Z");
    expect(streakDays([at("2026-10-27T01:00:00Z"), at("2026-10-25T10:00:00Z")], now)).toBe(1);
    expect(streakDays([at("2026-10-24T10:00:00Z")], now)).toBe(0);
    expect(streakDays([], now)).toBe(0);
  });
  it("aktivitas per hari berurutan dari yang terlama", () => {
    const now = at("2026-10-27T05:00:00Z");
    const r = activityByDay([at("2026-10-27T01:00:00Z"), at("2026-10-27T02:00:00Z"), at("2026-10-25T10:00:00Z")], 3, now);
    expect(r.map((x) => x.count)).toEqual([1, 0, 2]);
    expect(r[2].key).toBe("2026-10-27");
  });
});

describe("sertifikat", () => {
  it("hanya terbit bila semua pelajaran selesai dan ada pelajaran", () => {
    expect(courseFinished(0, 0)).toBe(false);
    expect(courseFinished(10, 9)).toBe(false);
    expect(courseFinished(10, 10)).toBe(true);
  });
  it("nomor stabil, berformat benar, dan berbeda per siswa atau kursus", () => {
    const d = at("2026-10-27T00:00:00Z");
    const a = certificateNo("u1", "c1", d);
    expect(a).toMatch(/^NZ-2026-[0-9A-F]{8}$/);
    expect(certificateNo("u1", "c1", d)).toBe(a);
    expect(certificateNo("u2", "c1", d)).not.toBe(a);
    expect(certificateNo("u1", "c2", d)).not.toBe(a);
  });
});

describe("tanya pengajar", () => {
  it("membuat tautan WhatsApp dengan pesan yang di-encode", () => {
    const url = whatsappLink("0812 3456 7890", "Halo ustadz, tanya soal bab 1");
    expect(url).toBe("https://wa.me/6281234567890?text=Halo%20ustadz%2C%20tanya%20soal%20bab%201");
  });
  it("mengembalikan null bila kontak masih placeholder", () => {
    expect(whatsappLink("[+62 nomor admin]", "tes")).toBeNull();
    expect(whatsappLink("", "tes")).toBeNull();
  });
});
