/**
 * Deleting an issue takes its comments and private chat with it, and the admin's
 * undo brings all of it back. Kept apart from lib/local-issues so that module
 * doesn't need to know about the stores that hang off an issue.
 */
import type { ChatThread } from "./chat";
import type { Comment } from "./comments";
import { restoreChats, takeChatsForIssues } from "./local-chat";
import { restoreComments, takeCommentsForIssues } from "./local-comments";
import { deleteIssues, restoreIssues } from "./local-issues";
import type { Issue } from "./types";

/** Everything a deletion removed, enough to put it all back. */
export interface DeletedBundle {
  issues: Issue[];
  comments: Comment[];
  chats: ChatThread[];
}

/** Deletes the issues together with their comments and chat threads. */
export function deleteIssuesWithData(issueIds: readonly string[]): DeletedBundle {
  const issues = deleteIssues(issueIds);
  const removedIds = issues.map((issue) => issue.id);
  return {
    issues,
    comments: takeCommentsForIssues(removedIds),
    chats: takeChatsForIssues(removedIds),
  };
}

/** The admin's undo: issues first, then what hung off them. */
export function restoreDeleted(bundle: DeletedBundle): void {
  restoreIssues(bundle.issues);
  restoreComments(bundle.comments);
  restoreChats(bundle.chats);
}
