import type {
  AppLocale,
  TranslationKey,
  TranslationMessages,
  TranslationParams,
} from "@/lib/i18n/config";
import { enMessages } from "@/lib/i18n/messages/en";
import { ruMessages } from "@/lib/i18n/messages/ru";

const messagesByLocale: Record<AppLocale, TranslationMessages> = {
  ru: ruMessages,
  en: enMessages,
};

function readMessage(
  messages: TranslationMessages,
  key: TranslationKey,
): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (current, segment) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[segment]
          : undefined,
      messages,
    );

  return typeof value === "string" ? value : undefined;
}

function interpolateTranslation(
  message: string,
  params?: TranslationParams,
) {
  if (!params) {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function getTranslation(
  locale: AppLocale,
  key: TranslationKey,
  params?: TranslationParams,
) {
  const localizedValue = readMessage(messagesByLocale[locale], key);

  if (localizedValue) {
    return interpolateTranslation(localizedValue, params);
  }

  const fallbackValue = readMessage(enMessages, key);

  if (fallbackValue) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Missing translation for "${key}" in locale "${locale}".`);
    }

    return interpolateTranslation(fallbackValue, params);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`Missing translation key "${key}" in all locales.`);
  }

  return key;
}
