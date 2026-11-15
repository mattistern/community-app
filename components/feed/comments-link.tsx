"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { countComments } from "@/lib/comments";
import { useComments } from "@/lib/local-comments";

/** Card footer link to the issue page, showing how many comments it has. */
export function CommentsLink({ issueId }: { issueId: string }) {
  const comments = useComments();
  const count = comments === null ? 0 : countComments(comments, issueId);

  return (
    <Link
      href={`/issue/${issueId}`}
      className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <MessageCircle aria-hidden className="size-4" />
      {count > 0 ? `תגובות (${count})` : "פרטים ותגובות"}
    </Link>
  );
}
