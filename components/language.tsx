"use client";

import { useSyncExternalStore } from "react";
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
  return isLanguage(stored) ? stored : defaultLanguage;
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

  return (
    <div className="language-switch" aria-label="Language">
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
