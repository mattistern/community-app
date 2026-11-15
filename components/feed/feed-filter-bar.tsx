"use client";

import type { FeedFilters, FeedView } from "@/lib/feed-filters";
import type { IssueCategory } from "@/lib/types";
import { CategorySelect } from "./category-select";
import { FilterPills } from "./filter-pills";
import { SearchInput } from "./search-input";

interface FeedFilterBarProps {
  filters: FeedFilters;
  onViewChange: (view: FeedView) => void;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: IssueCategory | null) => void;
}

/** Search box, category filter and filter pills (DESIGN.md §3.B). */
export function FeedFilterBar({
  filters,
  onViewChange,
  onQueryChange,
  onCategoryChange,
}: FeedFilterBarProps) {
  return (
    <div role="search" aria-label="חיפוש וסינון דיווחים" className="space-y-3">
      <div className="flex gap-2">
        <SearchInput value={filters.query} onChange={onQueryChange} />
        <CategorySelect value={filters.category} onChange={onCategoryChange} />
      </div>
      <FilterPills value={filters.view} onChange={onViewChange} />
    </div>
  );
}
