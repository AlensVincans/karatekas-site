"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { defaultLanguage, dictionary, languages, type Language } from "../lib/i18n";

const storageKey = "kg_language";
const changeEvent = "kg-language-change";

function isLanguage(value: string | null): value is Language {
  return languages.some((language) => language.code === value);
}

function readLanguage(): Language {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (isLanguage(stored)) {
    return stored;
  }

  const browserLanguages = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];
  const browserLanguage = browserLanguages
    .map((value) => value?.slice(0, 2).toLowerCase())
    .find(isLanguage);

  return browserLanguage ?? defaultLanguage;
}

function serverLanguage(): Language {
  return defaultLanguage;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, readLanguage, serverLanguage);

  function setLanguage(next: Language) {
    window.localStorage.setItem(storageKey, next);
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: next }));
  }

  return {
    language,
    setLanguage,
    t: dictionary[language],
  };
}

export function LanguageSelect() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeLanguage = languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function chooseLanguage(next: Language) {
    setLanguage(next);
    setOpen(false);
  }

  return (
    <div
      className={open ? "language-switch open" : "language-switch"}
      aria-label="Language"
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-label="Language"
        className="language-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={`language-flag flag-${language}`} />
        <span>{activeLanguage.label}</span>
      </button>
      {open ? (
        <div className="language-menu" role="listbox">
          {languages.map((item) => (
            <button
              aria-selected={item.code === language}
              className={item.code === language ? "active" : ""}
              key={item.code}
              onClick={() => chooseLanguage(item.code)}
              role="option"
              type="button"
            >
              <span className={`language-flag flag-${item.code}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
