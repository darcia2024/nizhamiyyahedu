import { describe, expect, it } from "vitest";
import { formatVideoTime, playerEmbedSrc } from "@/lib/video";

const embed = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

describe("player sendiri", () => {
  it("mematikan kontrol YouTube dan menyalakan API", () => {
    const u = new URL(playerEmbedSrc(embed, "https://belajarditimurtengah.com"));
    expect(u.origin + u.pathname).toBe(embed);
    expect(u.searchParams.get("controls")).toBe("0");
    expect(u.searchParams.get("enablejsapi")).toBe("1");
    expect(u.searchParams.get("fs")).toBe("0");
    expect(u.searchParams.get("origin")).toBe("https://belajarditimurtengah.com");
  });

  it("memakai kontrol bawaan sebagai cadangan", () => {
    expect(new URL(playerEmbedSrc(embed, "https://a.test", true)).searchParams.get("controls")).toBe("1");
  });

  it("menulis waktu dengan benar", () => {
    expect(formatVideoTime(0)).toBe("0:00");
    expect(formatVideoTime(65)).toBe("1:05");
    expect(formatVideoTime(6720)).toBe("1:52:00");
    expect(formatVideoTime(NaN)).toBe("0:00");
  });
});
