import { renderAppIcon } from "@/lib/pwa-icon";

// iOS rounds the corners itself, so it gets the full-bleed square.
export function GET() {
  return renderAppIcon(180, "maskable");
}
