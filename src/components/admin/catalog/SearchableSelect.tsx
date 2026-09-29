"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { inputClass } from "./ui";

type Option = { value: string; label: string; hint?: string };

/** Type-to-filter dropdown (combobox) — used for brands, where the list can be long. */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyText = "No matches",
  invalid,
  clearable = true,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
  clearable?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const choose = (o: Option) => {
    onChange(o.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          autoComplete="off"
          value={open ? query : (selected?.label ?? "")}
          placeholder={selected?.label ?? placeholder}
          onFocus={() => {
            setOpen(true);
            setHighlight(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(filtered.length - 1, h + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(0, h - 1));
            } else if (e.key === "Enter" && open && filtered[highlight]) {
              e.preventDefault();
              choose(filtered[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={`${inputClass} pr-16`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {clearable && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 rounded hover:bg-secondary text-muted-foreground"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </span>
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                  i === highlight ? "bg-secondary" : ""
                }`}
              >
                <span>
                  {o.label}
                  {o.hint && <span className="ml-2 text-xs text-muted-foreground">{o.hint}</span>}
                </span>
                {o.value === value && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
