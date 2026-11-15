/**
 * The app icon (the header's blue megaphone tile) drawn as a PNG, so the install
 * icons don't need image files kept in step with the brand. "maskable" icons are
 * full-bleed with the glyph kept inside the safe zone, because the phone crops
 * them to its own shape; "any" icons are a rounded tile.
 */
import { ImageResponse } from "next/og";

export function renderAppIcon(size: number, kind: "any" | "maskable"): ImageResponse {
  const maskable = kind === "maskable";
  const glyph = Math.round(size * (maskable ? 0.46 : 0.58));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563EB",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <svg
          width={glyph}
          height={glyph}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
