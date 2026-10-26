export type PhoneResult = { ok: true; value: string } | { ok: false; message: string };

/** Normalisasi nomor WhatsApp Indonesia ke format 62xxxxxxxxxx (PRD 10.3). */
export function normalizePhone(input: string): PhoneResult {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, message: "Nomor WhatsApp wajib diisi." };
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(cleaned)) return { ok: false, message: "Gunakan angka saja." };
  let local: string;
  if (cleaned.startsWith("+62")) local = "0" + cleaned.slice(3);
  else if (cleaned.startsWith("62")) local = "0" + cleaned.slice(2);
  else local = cleaned;
  if (!/^08/.test(local)) return { ok: false, message: "Nomor harus diawali 08 atau +62." };
  if (local.length < 10) {
    return { ok: false, message: "Nomor terlalu pendek. Masukkan 10 sampai 13 digit, misalnya 0812 3456 7890." };
  }
  if (local.length > 13) {
    return { ok: false, message: "Nomor terlalu panjang. Masukkan 10 sampai 13 digit, misalnya 0812 3456 7890." };
  }
  if (!/^08[1-9]\d{7,11}$/.test(local)) {
    return { ok: false, message: "Nomor tidak valid. Contoh yang benar: 0812 3456 7890." };
  }
  return { ok: true, value: "62" + local.slice(1) };
}

export function maskPhone(p: string): string {
  return p.length <= 6 ? p : p.slice(0, 4) + "****" + p.slice(-4);
}
