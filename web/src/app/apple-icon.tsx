import { ImageResponse } from "next/og";

// Ikon layar utama iPhone (apple-touch-icon). iOS membulatkan sudutnya sendiri, jadi latar dibuat penuh.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1E715C" }}>
        <svg width="112" height="112" viewBox="0 0 64 64" fill="none" stroke="#F2E6C4" strokeWidth="3.4">
          <path d="M16 16h32v32H16z" />
          <path d="m32 9 23 23-23 23L9 32z" />
        </svg>
      </div>
    ),
    size,
  );
}
