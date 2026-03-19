"use client";

import Link from "next/link";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useLocale } from "@/lib/i18n/provider";
import { productDictionaryRoute } from "@/lib/products";

export function ProductsPlaceholder() {
  const { locale } = useLocale();
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Список покупок",
          title: "Products",
          description:
            "Этот раздел станет списком покупок на текущую неделю и будет собираться из меню на неделю.",
          cardLabel: "Текущая неделя",
          cardText:
            "Скоро здесь появится shopping-list-first экран: продукты из выбранных блюд и спокойная ручная доработка списка.",
          weeklyMenuCta: "Вернуться к меню на неделю",
          supportTitle: "Словарь продуктов теперь живёт в Settings",
          supportText:
            "Канонические продукты, синонимы и архив остаются доступны как support layer, но больше не являются главным экраном Products.",
          supportCta: "Открыть словарь продуктов",
          note: "На этом этапе shopping list логика ещё не подключена.",
        }
      : {
          eyebrow: "Shopping List",
          title: "Products",
          description:
            "This section will become your shopping list for the current week, built from the weekly menu.",
          cardLabel: "This week",
          cardText:
            "A shopping-list-first screen will live here soon, with products gathered from planned dishes and a simple place for manual adjustments.",
          weeklyMenuCta: "Back to Weekly Menu",
          supportTitle: "The product dictionary now lives in Settings",
          supportText:
            "Canonical products, aliases, and archive handling remain available as a support layer, but they are no longer the main Products screen.",
          supportCta: "Open product dictionary",
          note: "Shopping list logic is intentionally not connected in this phase.",
        };

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <SurfaceCard className="bg-gradient-to-br from-white to-sand">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cocoa">{copy.cardLabel}</p>
            <p className="mt-1 text-sm leading-6 text-cocoa">
              {copy.cardText}
            </p>
          </div>
          <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-semibold text-leaf">
            Phase 1
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex justify-center rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {copy.weeklyMenuCta}
          </Link>
          <p className="self-center text-sm text-cocoa">{copy.note}</p>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-3">
        <p className="text-sm font-semibold text-ink">{copy.supportTitle}</p>
        <p className="text-sm leading-6 text-cocoa">{copy.supportText}</p>
        <Link
          href={productDictionaryRoute}
          className="inline-flex rounded-2xl border border-clay/25 bg-white px-4 py-3 text-sm font-semibold text-cocoa"
        >
          {copy.supportCta}
        </Link>
      </SurfaceCard>
    </div>
  );
}
