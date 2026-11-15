"use client";

import Link from "next/link";
import { ChevronLeft, MessageSquareMore } from "lucide-react";
import { unreadThreadsForResident } from "@/lib/chat";
import { useChats } from "@/lib/local-chat";

/**
 * The prominent top banner for a resident with an unread private message from
 * an admin. It links to the newest such conversation and disappears once the
 * thread has been opened.
 */
export function UnreadChatBanner({ phone }: { phone: string }) {
  const chats = useChats();
  if (chats === null) return null;

  const unread = unreadThreadsForResident(chats, phone);
  if (unread.length === 0) return null;

  return (
    <Link
      href={`/issue/${unread[0].issueId}`}
      role="status"
      className="flex items-center gap-3 bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
    >
      <MessageSquareMore aria-hidden className="size-6 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          {unread.length === 1
            ? "יש לך הודעה חדשה מההנהלה"
            : `יש לך ${unread.length} שיחות עם הודעות חדשות מההנהלה`}
        </span>
        <span className="block text-xs text-blue-100">הקישו כדי לקרוא ולהשיב</span>
      </span>
      <ChevronLeft aria-hidden className="size-5 shrink-0" />
    </Link>
  );
}
