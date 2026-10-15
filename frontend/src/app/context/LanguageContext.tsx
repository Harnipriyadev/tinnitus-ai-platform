"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SUPPORTED_LANGUAGES = [
  "en",
  "hi",
  "kn",
] as const;

export type Language =
  (typeof SUPPORTED_LANGUAGES)[number];

type LanguageContextValue = {
  language: Language;
  setLanguage: (
    language: Language
  ) => void;
};

const LANGUAGE_STORAGE_KEY =
  "ai-tinnitus-language";

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

const isSupportedLanguage = (
  value: string | null
): value is Language =>
  SUPPORTED_LANGUAGES.includes(
    value as Language
  );

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * English is used for the server render so
   * React hydration remains consistent.
   */
  const [language, setLanguageState] =
    useState<Language>("en");

  /*
   * Restore the user's saved choice once when
   * the application starts. The same language
   * is then used across every page and refresh.
   */
  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      isSupportedLanguage(
        savedLanguage
      )
    ) {
      setLanguageState(
        savedLanguage
      );
    }
  }, []);

  const setLanguage =
    useCallback(
      (
        selectedLanguage: Language
      ) => {
        setLanguageState(
          selectedLanguage
        );

        window.localStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          selectedLanguage
        );
      },
      []
    );

  /*
   * Keep the document language synchronized
   * for browsers and assistive technology.
   */
  useEffect(() => {
    document.documentElement.lang =
      language;
  }, [language]);

  /*
   * Synchronize the choice if another tab of
   * the website changes the language.
   */
  useEffect(() => {
    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key ===
          LANGUAGE_STORAGE_KEY &&
        isSupportedLanguage(
          event.newValue
        )
      ) {
        setLanguageState(
          event.newValue
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(
    LanguageContext
  );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
