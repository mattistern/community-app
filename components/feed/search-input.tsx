"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name; defaults to the residents' feed wording. */
  label?: string;
}

/**
 * Live search box. The text is 16px on purpose: iOS Safari zooms the whole page
 * when a field with smaller text gets focus.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "חיפוש דיווחים קיימים...",
  label = "חיפוש דיווחים",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // The phone keyboard's "search" key: hide it so the results are visible.
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white ps-10 pe-11 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value !== "" && (
        <button
          type="button"
          aria-label="נקה חיפוש"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-xl text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
