"use client";

import { useState } from "react";
import { DialogSheet } from "@/components/ui/dialog-sheet";
import type { Issue } from "@/lib/types";
import { NewIssueForm } from "./new-issue-form";

interface NewIssueModalProps {
  authorPhone: string;
  cooldownMs: number;
  onCreated: (issue: Issue) => void;
  /** Called once the dialog has closed (button, Escape or the phone's back button). */
  onClose: () => void;
}

/**
 * The new-issue dialog: a bottom sheet on phones, a centered dialog on larger
 * screens. It is mounted only while open, so every report starts with an empty
 * form, and it refuses to close while a report is being sent.
 */
export function NewIssueModal({
  authorPhone,
  cooldownMs,
  onCreated,
  onClose,
}: NewIssueModalProps) {
  const [busy, setBusy] = useState(false);

  return (
    <DialogSheet
      labelledBy="new-issue-title"
      canClose={!busy}
      onClose={onClose}
    >
      {({ close }) => (
        <NewIssueForm
          authorPhone={authorPhone}
          cooldownMs={cooldownMs}
          onBusyChange={setBusy}
          onCreated={onCreated}
          onClose={close}
        />
      )}
    </DialogSheet>
  );
}
