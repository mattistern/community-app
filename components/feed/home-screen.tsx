"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { UnreadChatBanner } from "@/components/chat/unread-chat-banner";
import { Feed } from "@/components/feed/feed";
import { FeedHeader } from "@/components/feed/feed-header";
import { useSessionState } from "@/lib/local-session";

function SignedInHome() {
  const phone = useSessionState()?.session?.phone;
  if (!phone) return null;

  return (
    // Mobile-first column (DESIGN.md §1); /admin gets its own full-width layout.
    <div className="mx-auto min-h-dvh w-full max-w-md bg-slate-50 md:border-x md:border-slate-200">
      <UnreadChatBanner phone={phone} />
      <FeedHeader />
      {/* pb-28 keeps the last card clear of the floating button. */}
      <main className="px-4 pb-28 pt-4">
        <Feed currentUserPhone={phone} />
      </main>
    </div>
  );
}

export function HomeScreen() {
  return (
    <AuthGate>
      <SignedInHome />
    </AuthGate>
  );
}
