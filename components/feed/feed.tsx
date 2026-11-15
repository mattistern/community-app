"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FILTERS,
  filterAndSortIssues,
  formatResultsCount,
  snapshotUrgency,
  type FeedFilters,
  type FeedView,
  type UrgencySnapshot,
} from "@/lib/feed-filters";
import { useIssues, voteOnIssue } from "@/lib/local-issues";
import type { Issue, IssueCategory } from "@/lib/types";
import { FeedEmptyState } from "./feed-empty-state";
import { FeedFilterBar } from "./feed-filter-bar";
import { FeedSkeleton } from "./feed-skeleton";
import { IssueCard } from "./issue-card";
import { LoadMore } from "./load-more";
import { NewIssueFlow } from "./new-issue-flow";

/** Cards whose thumbnails load immediately; the rest load lazily on scroll. */
const EAGER_MEDIA_COUNT = 2;

/** Cards loaded per batch; the feed never renders the whole list at once. */
const PAGE_SIZE = 10;

/** How long a freshly sent report stays ringed. */
const HIGHLIGHT_MS = 3000;

interface FeedProps {
  /** Phone of the signed-in resident: "הדיווחים שלי" and the author of new reports. */
  currentUserPhone: string;
}

/**
 * The resident feed: search, filter pills, the issue cards and the FAB that
 * opens the new-issue dialog. Issues and votes live in this browser's
 * localStorage (see lib/local-issues), so a vote or a new report shows up
 * instantly and survives a reload.
 */
export function Feed({ currentUserPhone }: FeedProps) {
  const issues = useIssues();
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const [urgencySnapshot, setUrgencySnapshot] = useState<UrgencySnapshot>();
  const [highlightedId, setHighlightedId] = useState<string>();
  // How many cards are on screen; grows as the resident scrolls, resets with the filters.
  const [shown, setShown] = useState(PAGE_SIZE);
  const loadMore = useCallback(() => setShown((count) => count + PAGE_SIZE), []);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(undefined), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  // Still null on the server and for the instant before the browser has loaded the issues.
  if (issues === null) return <FeedSkeleton />;

  const handleViewChange = (view: FeedView) => {
    // "דחוף ביותר" is ranked from the votes as they are when the pill is chosen
    // and keeps that order until the pill changes, so a card doesn't jump away
    // from under the resident's finger while they vote.
    setUrgencySnapshot(view === "דחוף ביותר" ? snapshotUrgency(issues) : undefined);
    setFilters((current) => ({ ...current, view }));
    setShown(PAGE_SIZE);
  };

  const handleQueryChange = (query: string) => {
    setFilters((current) => ({ ...current, query }));
    setShown(PAGE_SIZE);
  };

  const handleCategoryChange = (category: IssueCategory | null) => {
    setFilters((current) => ({ ...current, category }));
    setShown(PAGE_SIZE);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setUrgencySnapshot(undefined);
    setShown(PAGE_SIZE);
  };

  const handleCreated = (issue: Issue) => {
    // Make sure the new report is visible: drop any filter that would hide it,
    // ring it, and scroll up to it (after the dialog has released the page).
    handleClearFilters();
    setHighlightedId(issue.id);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  const visibleIssues = filterAndSortIssues(
    issues,
    filters,
    currentUserPhone,
    urgencySnapshot,
  );

  return (
    <>
      {issues.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          עדיין אין דיווחים בקהילה. אפשר לפתוח את הראשון בכפתור למטה.
        </p>
      ) : (
        <div className="space-y-4">
          <FeedFilterBar
            filters={filters}
            onViewChange={handleViewChange}
            onQueryChange={handleQueryChange}
            onCategoryChange={handleCategoryChange}
          />

          <p role="status" className="sr-only">
            {formatResultsCount(visibleIssues.length)}
          </p>

          {visibleIssues.length === 0 ? (
            <FeedEmptyState filters={filters} onClear={handleClearFilters} />
          ) : (
            <>
              <ul className="space-y-3">
                {visibleIssues.slice(0, shown).map((issue, index) => (
                  <li key={issue.id}>
                    <IssueCard
                      issue={issue}
                      onVote={voteOnIssue}
                      eagerMedia={index < EAGER_MEDIA_COUNT}
                      highlighted={issue.id === highlightedId}
                    />
                  </li>
                ))}
              </ul>
              <LoadMore
                shown={Math.min(shown, visibleIssues.length)}
                total={visibleIssues.length}
                onLoadMore={loadMore}
              />
            </>
          )}
        </div>
      )}

      <NewIssueFlow authorPhone={currentUserPhone} onCreated={handleCreated} />
    </>
  );
}
