import Image from "next/image";
import type { IssueMedia } from "@/lib/types";

/**
 * Low-res feed thumbnail. Only `thumbnailUrl` is loaded here; the full-res
 * asset (`fullUrl`) is reserved for an explicit tap (viewer comes with the
 * media task). `next/image` serves .svg sources unoptimized automatically.
 */
interface MediaThumbnailProps {
  media: IssueMedia;
  /** Load immediately instead of lazily. For above-the-fold cards (LCP). */
  eager?: boolean;
}

export function MediaThumbnail({ media, eager = false }: MediaThumbnailProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-slate-100">
      <Image
        src={media.thumbnailUrl}
        alt={media.alt}
        width={800}
        height={450}
        sizes="(min-width: 448px) 384px, calc(100vw - 64px)"
        loading={eager ? "eager" : "lazy"}
        className="aspect-video w-full object-cover"
      />
    </div>
  );
}
