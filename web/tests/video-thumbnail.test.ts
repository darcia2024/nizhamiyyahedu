import { describe, expect, it } from "vitest";
import { videoThumbnail } from "@/lib/video";

describe("thumbnail pelajaran", () => {
  const thumb = "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg";

  it("mengambil gambar dari berbagai bentuk tautan YouTube", () => {
    expect(videoThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe(thumb);
    expect(videoThumbnail("https://youtu.be/dQw4w9WgXcQ")).toBe(thumb);
    expect(videoThumbnail("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(thumb);
  });

  it("kosong kalau bukan YouTube atau belum ada video", () => {
    expect(videoThumbnail(null)).toBeNull();
    expect(videoThumbnail("")).toBeNull();
    expect(videoThumbnail("https://contoh.test/video.mp4")).toBeNull();
    expect(videoThumbnail("https://www.youtube.com/watch?v=pendek")).toBeNull();
  });
});
