"use client";

import Link from "next/link";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { type AppLocale } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/provider";
import { productDictionaryRoute } from "@/lib/products";

function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const t = useT();

  const options: Array<{ locale: AppLocale; label: string }> = [
    {
      locale: "ru",
      label: t("common.locale.ru"),
    },
    {
      locale: "en",
      label: t("common.locale.en"),
    },
  ];

  return (
    <div className="rounded-2xl bg-sand/55 px-4 py-3">
      <p className="text-sm font-semibold text-ink">{t("settings.language.label")}</p>
      <div className="mt-3 inline-flex rounded-[1.2rem] border border-white/80 bg-sand/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
        {options.map((option) => {
          const isCurrent = option.locale === locale;

          return (
            <button
              key={option.locale}
              type="button"
              onClick={() => {
                if (!isCurrent) {
                  setLocale(option.locale);
                }
              }}
              aria-pressed={isCurrent}
              className={[
                "rounded-[1rem] px-4 py-2 text-sm font-semibold transition duration-200",
                isCurrent
                  ? "border border-white/90 bg-white text-ink shadow-sm"
                  : "text-cocoa/85 hover:bg-white/60 hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsPlaceholder() {
  const t = useT();

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={t("settings.header.eyebrow")}
        title={t("settings.header.title")}
        description={t("settings.header.description")}
      />

      <SurfaceCard className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
            {t("settings.family.label")}
          </p>
          <p className="mt-2 font-semibold text-ink">{t("settings.family.name")}</p>
          <p className="mt-1 text-sm text-cocoa">
            {t("settings.family.description")}
          </p>
        </div>

        <div className="rounded-2xl bg-sand/55 px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {t("settings.planningMode.label")}
          </p>
          <p className="mt-1 text-sm text-cocoa">
            {t("settings.planningMode.description")}
          </p>
        </div>

        <div className="rounded-2xl bg-sand/55 px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {t("settings.secondUser.label")}
          </p>
          <p className="mt-1 text-sm text-cocoa">
            {t("settings.secondUser.description")}
          </p>
        </div>

        <div className="rounded-2xl bg-sand/55 px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {t("settings.productDictionary.title")}
          </p>
          <p className="mt-1 text-sm text-cocoa">
            {t("settings.productDictionary.description")}
          </p>
          <Link
            href={productDictionaryRoute}
            className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-cocoa shadow-sm"
          >
            {t("settings.productDictionary.cta")}
          </Link>
        </div>

        <LanguageSwitch />
      </SurfaceCard>
    </div>
  );
}
