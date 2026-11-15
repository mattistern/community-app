import { Suspense } from "react";
import type { Metadata } from "next";
import { IssueScreen } from "@/components/issue/issue-screen";

export const metadata: Metadata = { title: "פרטי פנייה" };

/**
 * Deep link to one issue (/issue/[id]). The data lives in the visitor's browser
 * (localStorage), so the page itself only passes the id along.
 */
export default function IssuePage({ params }: PageProps<"/issue/[id]">) {
  return (
    // The id is only known per request, so reading it needs a Suspense boundary.
    <Suspense fallback={<div className="min-h-dvh bg-slate-50" />}>
      {params.then(({ id }) => (
        <IssueScreen issueId={id} />
      ))}
    </Suspense>
  );
}
