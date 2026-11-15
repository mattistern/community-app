"use client";

import { useCallback, useState } from "react";
import { getLastPostAt } from "@/lib/local-issues";
import { cooldownRemainingMs } from "@/lib/new-issue";
import type { Issue } from "@/lib/types";
import { NewIssueFab } from "./new-issue-fab";
import { NewIssueModal } from "./new-issue-modal";
import { Toast } from "./toast";

interface NewIssueFlowProps {
  /** Phone of the signed-in resident: the report's author and the cooldown's owner. */
  authorPhone: string;
  onCreated: (issue: Issue) => void;
}

/** The FAB, the new-issue dialog it opens, and the confirmation after sending. */
export function NewIssueFlow({ authorPhone, onCreated }: NewIssueFlowProps) {
  // Set while the dialog is open; holds the cooldown left at the moment it opened.
  const [open, setOpen] = useState<{ cooldownMs: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  function openDialog() {
    setOpen({
      cooldownMs: cooldownRemainingMs(getLastPostAt(authorPhone), Date.now()),
    });
  }

  return (
    <>
      <NewIssueFab onClick={openDialog} />

      {open && (
        <NewIssueModal
          authorPhone={authorPhone}
          cooldownMs={open.cooldownMs}
          onClose={() => setOpen(null)}
          onCreated={(issue) => {
            onCreated(issue);
            setToast("הדיווח נשלח לביקורת הנהלה ומופיע בראש הפיד");
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </>
  );
}
