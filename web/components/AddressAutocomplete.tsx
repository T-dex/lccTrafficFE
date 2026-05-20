"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DEFAULT_ADDRESS } from "@/lib/constants";
import { searchAddresses, type AddressSuggestion } from "@/lib/addressSearch";

const SEARCH_DEBOUNCE_MS = 350;

export function AddressAutocomplete({
  id = "address",
  value,
  onChange,
  onCommit,
  placeholder = DEFAULT_ADDRESS,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Fired when user picks a suggestion or confirms with Enter */
  onCommit?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const pick = useCallback(
    (s: AddressSuggestion) => {
      onChange(s.full);
      close();
      onCommit?.(s.full);
    },
    [onChange, onCommit, close],
  );

  const runSearch = useCallback(
    (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      const trimmed = q.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        setLoading(false);
        close();
        return;
      }

      setLoading(true);
      setOpen(true);
      searchTimer.current = setTimeout(() => {
        const seq = ++searchSeq.current;
        void searchAddresses(trimmed).then((items) => {
          if (seq !== searchSeq.current) return;
          setSuggestions(items);
          setLoading(false);
          setActiveIndex(items.length ? 0 : -1);
          if (items.length) setOpen(true);
        });
      }, SEARCH_DEBOUNCE_MS);
    },
    [close],
  );

  useEffect(() => {
    const onDocPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [close]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const onInputChange = (v: string) => {
    onChange(v);
    runSearch(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && suggestions.length) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
        return;
      }
      close();
      onCommit?.(value.trim());
    }
  };

  return (
    <div ref={wrapRef} className="address-autocomplete">
      <input
        ref={inputRef}
        id={id}
        type="text"
        name="address"
        className="address-autocomplete__input"
        placeholder={placeholder}
        autoComplete="street-address"
        autoCorrect="off"
        autoCapitalize="words"
        enterKeyHint="search"
        inputMode="text"
        spellCheck={false}
        value={value}
        disabled={disabled}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= 3) runSearch(value);
        }}
        onKeyDown={onKeyDown}
      />

      {open && (loading || suggestions.length > 0) ? (
        <ul id={listId} className="address-suggestions" role="listbox">
          {loading && suggestions.length === 0 ? (
            <li className="address-suggestions__hint" role="presentation">
              Searching…
            </li>
          ) : null}
          {suggestions.map((s, i) => (
            <li key={`${s.full}-${i}`} role="presentation">
              <button
                type="button"
                id={`${listId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`address-suggestions__item${i === activeIndex ? " address-suggestions__item--active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="address-suggestions__primary">{s.label}</span>
                {s.full !== s.label ? (
                  <span className="address-suggestions__secondary">{s.full}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
