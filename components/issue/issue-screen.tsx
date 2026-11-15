"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, SearchX } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { AdminNote } from "@/components/feed/admin-note";
import { RelativeTime } from "@/components/feed/relative-time";
import { ShareButton } from "@/components/feed/share-button";
import { StatusBadge } from "@/components/feed/status-badge";
import { UrgencyRating } from "@/components/feed/urgency-rating";
import { UrgencyScore } from "@/components/feed/urgency-score";
import { useIssues, voteOnIssue } from "@/lib/local-issues";
import { useSessionState, type Session } from "@/lib/local-session";
import { AdminPanel } from "./admin-panel";
import { ChatPanel } from "./chat-panel";
import { CommentsSection } from "./comments-section";
import { IssuePhoto } from "./issue-photo";

const backLinkClass =
  "grid size-11 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    // Same mobile-first column as the feed (DESIGN.md §1).
    <div className="mx-auto min-h-dvh w-full max-w-md bg-slate-50 md:border-x md:border-slate-200">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-slate-200 bg-white/90 pe-4 ps-2 backdrop-blur">
        <Link href="/" aria-label="חזרה לפיד הקהילה" title="חזרה לפיד הקהילה" className={backLinkClass}>
          <ArrowRight aria-hidden className="size-5" />
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h1>
      </header>
      {children}
    </div>
  );
}

function NotFound() {
  return (
    <Frame title="פנייה">
      <main className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <SearchX aria-hidden className="size-7" />
        </span>
        <h2 className="text-xl font-extrabold text-slate-900">הפנייה לא נמצאה</h2>
        <p className="text-sm text-slate-600">
          ייתכן שהקישור שגוי, או שהפנייה נמחקה. הנתונים נשמרים בדפדפן הזה בלבד.
        </p>
        <Link
          href="/"
          className="grid h-12 w-full place-items-center rounded-xl bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          חזרה לפיד הקהילה
        </Link>
      </main>
    </Frame>
  );
}

function IssueBody({ issueId, session }: { issueId: string; session: Session }) {
  const issues = useIssues();

  if (issues === null) {
    return (
      <Frame title="פנייה">
        <div role="status" className="space-y-3 px-4 py-6">
          <span className="sr-only">טוען…</span>
          <div aria-hidden className="h-6 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div aria-hidden className="h-24 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
        </div>
      </Frame>
    );
  }

  const issue = issues.find((candidate) => candidate.id === issueId);
  if (!issue) return <NotFound />;

  return (
    <Frame title={`פנייה #${issue.id}`}>
      <main className="space-y-5 px-4 pb-16 pt-4">
        <article
          aria-labelledby="issue-title"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <RelativeTime iso={issue.createdAt} className="text-xs text-slate-500" />
            <StatusBadge status={issue.status} />
          </div>

          {(issue.category || issue.location) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {issue.category && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {issue.category}
                </span>
              )}
              {issue.location && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin aria-hidden className="size-3.5" />
                  {issue.location}
                </span>
              )}
            </div>
          )}

          <h2
            id="issue-title"
            className="mt-2.5 break-words text-xl font-bold leading-snug text-slate-900"
          >
            {issue.title}
          </h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-slate-700">
            {issue.description}
          </p>

          {issue.adminNote && <AdminNote note={issue.adminNote} />}
          {issue.media && (
            <div className="mt-3">
              <IssuePhoto media={issue.media} />
            </div>
          )}

          <footer className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between gap-3">
              <UrgencyScore ratingSum={issue.ratingSum} voteCount={issue.voteCount} />
              <ShareButton issueId={issue.id} title={issue.title} />
            </div>
            <UrgencyRating
              issueId={issue.id}
              myVote={issue.myVote}
              onVote={(value) => voteOnIssue(issue.id, value)}
            />
          </footer>
        </article>

        {session.role === "admin" && <AdminPanel issue={issue} />}

        <ChatPanel issue={issue} session={session} />

        <CommentsSection issueId={issue.id} session={session} />
      </main>
    </Frame>
  );
}

/** The issue page's client side: sign-in first, then the issue, the admin tools and the comments. */
export function IssueScreen({ issueId }: { issueId: string }) {
  return (
    <AuthGate>
      <SignedIn issueId={issueId} />
    </AuthGate>
  );
}

function SignedIn({ issueId }: { issueId: string }) {
  const session = useSessionState()?.session;
  if (!session) return null;
  return <IssueBody issueId={issueId} session={session} />;
}
