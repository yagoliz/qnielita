"use client";

import { useState, useRef, useEffect } from "react";

export type ComboboxItem = {
  id: string;
  label: string;
  searchTerms: string;
};

type SearchComboboxProps = {
  items: ComboboxItem[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
};

export function SearchCombobox({
  items,
  value,
  onChange,
  disabled = false,
  placeholder = "Buscar...",
  name,
}: SearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedItem = items.find((item) => item.id === value) ?? null;

  const filtered = query
    ? items.filter((item) =>
        item.searchTerms.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      highlighted?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(item: ComboboxItem) {
    onChange(item.id);
    setQuery("");
    setIsOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }

  if (disabled && selectedItem) {
    return (
      <>
        {name && <input type="hidden" name={name} value={value ?? ""} />}
        <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-700">
          {selectedItem.label}
        </div>
      </>
    );
  }

  if (disabled) {
    return (
      <div className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-400">
        {placeholder}
      </div>
    );
  }

  if (selectedItem && !isOpen) {
    return (
      <div ref={containerRef} className="relative">
        {name && <input type="hidden" name={name} value={value ?? ""} />}
        <div className="flex items-center gap-2 w-full rounded-lg border border-green-600 bg-green-50 px-3 py-2 text-sm">
          <span className="flex-1">{selectedItem.label}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 text-xs"
            aria-label="Borrar selección"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
          ) : (
            filtered.map((item, i) => (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlightedIndex ? "bg-green-50 text-green-800" : ""
                }`}
              >
                {item.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}