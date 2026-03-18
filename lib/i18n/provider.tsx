"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import {
  localeCookieAttributes,
  localeCookieName,
  type AppLocale,
  type TranslationKey,
  type TranslationParams,
} from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: AppLocale) {
  document.cookie = `${localeCookieName}=${locale}; ${localeCookieAttributes}`;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  function setLocale(nextLocale: AppLocale) {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (key, params) => getTranslation(locale, key, params),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

function useLocaleContext() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("LocaleProvider is required to use localization hooks.");
  }

  return context;
}

export function useLocale() {
  return useLocaleContext();
}

export function useT() {
  return useLocaleContext().t;
}
