"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchBar({
  onChange,
  placeholder = "Search subscriptions",
  value,
}: SearchBarProps) {
  return (
    <label className="relative flex items-center">
      <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
      <input
        className="h-12 w-full rounded-full border border-black/10 bg-white/88 pl-11 pr-12 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="absolute right-2 inline-flex size-8 items-center justify-center rounded-full text-black/45 transition hover:bg-stone hover:text-ink"
          onClick={() => onChange("")}
          type="button"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
