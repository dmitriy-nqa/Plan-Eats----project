"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  countPillClassName,
  errorSurfaceClassName,
  sectionContentStackClassName,
  sectionHeaderButtonClassName,
  sectionHeaderCountClassName,
  sectionHeaderTitleRowClassName,
  stateSurfaceBadgeClassName,
  stateSurfaceBodyClassName,
  stateSurfaceClassName,
  stateSurfaceDescriptionClassName,
  stateSurfaceTitleClassName,
  topSurfaceClassName,
  topSurfaceDescriptionClassName,
  topSurfaceIntroClassName,
  topSurfaceStackClassName,
} from "@/components/ui/presentation";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useLocale, useT } from "@/lib/i18n/provider";
import {
  dishCategoryValues,
  getDishCategoryLabel,
  getDishLibraryHref,
  type DishCategory,
  type DishLibraryMode,
  type DishSummary,
} from "@/lib/dishes";

const summaryClampStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  overflow: "hidden",
};

type DishLibrarySection = {
  category: DishCategory;
  label: string;
  dishes: DishSummary[];
};

function getCollapsedSectionsStorageKey(mode: DishLibraryMode) {
  return `dish-library:collapsed-sections:${mode}`;
}

function readCollapsedSections(mode: DishLibraryMode): Partial<Record<DishCategory, boolean>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(getCollapsedSectionsStorageKey(mode));

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return dishCategoryValues.reduce<Partial<Record<DishCategory, boolean>>>(
      (nextValue, category) => {
        if (typeof parsedValue[category] === "boolean") {
          nextValue[category] = parsedValue[category];
        }

        return nextValue;
      },
      {},
    );
  } catch {
    return {};
  }
}

function writeCollapsedSections(
  mode: DishLibraryMode,
  value: Partial<Record<DishCategory, boolean>>,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getCollapsedSectionsStorageKey(mode),
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage write failures and keep the UI responsive.
  }
}

function SearchField({
  value,
  onChange,
  label,
  placeholder,
  badgeLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  badgeLabel: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/80 bg-white/92 px-4 py-3 shadow-sm">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand text-xs font-bold text-cocoa">
          {badgeLabel}
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-cocoa/60"
        />
      </div>
    </label>
  );
}

function ModeSwitch({ mode }: { mode: DishLibraryMode }) {
  const t = useT();

  return (
    <div className="inline-flex rounded-[1.2rem] border border-white/80 bg-sand/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      {(["active", "archived"] as const).map((option) => {
        const isCurrent = option === mode;

        return (
          <Link
            key={option}
            href={getDishLibraryHref(option)}
            prefetch={false}
            aria-current={isCurrent ? "page" : undefined}
            className={[
              "rounded-[1rem] px-4 py-2 text-sm font-semibold transition duration-200",
              isCurrent
                ? "border border-white/90 bg-white text-ink shadow-sm"
                : "text-cocoa/85 hover:bg-white/60 hover:text-ink",
            ].join(" ")}
          >
            {option === "active"
              ? t("dishes.mode.active")
              : t("dishes.mode.archived")}
          </Link>
        );
      })}
    </div>
  );
}

function DishCard({
  dish,
  mode,
  locale,
}: {
  dish: DishSummary;
  mode: DishLibraryMode;
  locale: "ru" | "en";
}) {
  const isArchivedMode = mode === "archived";

  return (
    <Link
      href={`/dishes/${dish.id}?mode=${mode}`}
      prefetch={false}
      className={[
        "group flex items-start gap-3.5 rounded-[1.4rem] border px-4 py-3.5 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/35 focus-visible:ring-offset-2",
        isArchivedMode
          ? "border-white/70 bg-almond/55 hover:bg-almond/70 focus-visible:ring-offset-almond/40"
          : "border-white/80 bg-white/90 hover:bg-white focus-visible:ring-offset-cream",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="break-words text-sm font-semibold leading-5 text-ink">{dish.name}</p>
            <p
              className={[
                "text-xs font-medium",
                isArchivedMode ? "text-cocoa/75" : "text-clay",
              ].join(" ")}
            >
              {getDishCategoryLabel(dish.category, locale)}
            </p>
          </div>

          <span
            className={[
              "mt-0.5 inline-flex shrink-0 items-center transition",
              isArchivedMode
                ? "text-cocoa/45 group-hover:text-cocoa/75"
                : "text-cocoa/55 group-hover:text-cocoa",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4.5 9.5 8 6 11.5" />
            </svg>
          </span>
        </div>

        <p
          className={[
            "mt-2.5 break-words text-sm leading-6",
            isArchivedMode ? "text-cocoa/88" : "text-cocoa/92",
          ].join(" ")}
          style={summaryClampStyle}
        >
          {dish.summary}
        </p>
      </div>
    </Link>
  );
}

function SectionToggle({
  label,
  count,
  isExpanded,
  onToggle,
}: {
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${sectionHeaderButtonClassName} hover:bg-white/42`}
      aria-expanded={isExpanded}
    >
      <div className={sectionHeaderTitleRowClassName}>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <span className={sectionHeaderCountClassName}>
          {count}
        </span>
      </div>

      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-cocoa shadow-sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={[
            "h-4 w-4 transition",
            isExpanded ? "rotate-90" : "rotate-0",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4.5 9.5 8 6 11.5" />
        </svg>
      </span>
    </button>
  );
}

function EmptyDishState({
  mode,
  isSearchEmpty,
}: {
  mode: DishLibraryMode;
  isSearchEmpty: boolean;
}) {
  const t = useT();
  const showAddDishAction = !isSearchEmpty && mode === "active";
  const showGoToActiveAction = !isSearchEmpty && mode === "archived";
  const title = isSearchEmpty
    ? t("dishes.library.empty.search.title")
    : mode === "active"
      ? t("dishes.library.empty.active.title")
      : t("dishes.library.empty.archived.title");
  const description = isSearchEmpty
    ? t("dishes.library.empty.search.description")
    : mode === "active"
      ? t("dishes.library.empty.active.description")
      : t("dishes.library.empty.archived.description");

  return (
    <SurfaceCard className={stateSurfaceClassName}>
      <div className={stateSurfaceBodyClassName}>
        <div className={stateSurfaceBadgeClassName}>
          {t("navigation.badges.dishLibrary")}
        </div>
        <h2 className={stateSurfaceTitleClassName}>
          {title}
        </h2>
        <p className={stateSurfaceDescriptionClassName}>{description}</p>
        {showAddDishAction ? (
          <Link
            href="/dishes/new"
            prefetch={false}
            className="mt-5 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {t("dishes.actions.addDish")}
          </Link>
        ) : null}
        {showGoToActiveAction ? (
          <Link
            href={getDishLibraryHref("active")}
            prefetch={false}
            className="mt-5 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {t("dishes.library.empty.archived.cta")}
          </Link>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

function groupDishesByCategory(
  dishes: DishSummary[],
  locale: "ru" | "en",
) {
  return dishCategoryValues.reduce<DishLibrarySection[]>((sections, category) => {
    const categoryDishes = dishes.filter((dish) => dish.category === category);

    if (categoryDishes.length === 0) {
      return sections;
    }

    sections.push({
      category,
      label: getDishCategoryLabel(category, locale),
      dishes: categoryDishes,
    });

    return sections;
  }, []);
}

export function DishListScreen({
  initialDishes,
  mode,
  errorMessage,
}: {
  initialDishes: DishSummary[];
  mode: DishLibraryMode;
  errorMessage?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<
    Partial<Record<DishCategory, boolean>>
  >(() => readCollapsedSections(mode));
  const collapsedSectionsModeRef = useRef(mode);

  useEffect(() => {
    if (collapsedSectionsModeRef.current !== mode) {
      collapsedSectionsModeRef.current = mode;
      setCollapsedSections(readCollapsedSections(mode));
      return;
    }

    writeCollapsedSections(mode, collapsedSections);
  }, [collapsedSections, mode]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDishes = initialDishes.filter((dish) => {
    if (!normalizedQuery) {
      return true;
    }

    return [dish.name, dish.summary].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
  const sections = groupDishesByCategory(filteredDishes, locale);
  const hasDishes = initialDishes.length > 0;
  const hasResults = sections.length > 0;
  const hasSearchQuery = normalizedQuery.length > 0;
  const showAddDishAction = mode === "active";

  function toggleSection(category: DishCategory) {
    if (hasSearchQuery) {
      return;
    }

    setCollapsedSections((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={t("dishes.library.header.eyebrow")}
        title={t("dishes.library.header.title")}
        description={t("dishes.library.header.description")}
      />

      <section className={topSurfaceClassName}>
        <div className={topSurfaceStackClassName}>
          <div className={topSurfaceIntroClassName}>
            <div className="flex flex-wrap items-center gap-3">
              <ModeSwitch mode={mode} />
              <span className={countPillClassName}>
                {t("dishes.library.count", { count: initialDishes.length })}
              </span>
            </div>

            <p className={topSurfaceDescriptionClassName}>
              {mode === "active"
                ? t("dishes.library.activeDescription")
                : t("dishes.library.archivedDescription")}
            </p>
          </div>

          {showAddDishAction ? (
            <Link
              href="/dishes/new"
              prefetch={false}
              className="inline-flex self-start rounded-[1.2rem] bg-clay px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              {t("dishes.actions.addDish")}
            </Link>
          ) : null}

          <SearchField
            value={query}
            onChange={setQuery}
            label={t("dishes.search.label")}
            placeholder={t("dishes.search.placeholder")}
            badgeLabel={t("common.badges.search")}
          />
        </div>
      </section>

      {errorMessage ? (
        <SurfaceCard className={errorSurfaceClassName}>
          <p className="text-sm font-semibold text-ink">
            {t("dishes.library.errorTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-cocoa">{errorMessage}</p>
        </SurfaceCard>
      ) : null}

      {!errorMessage && !hasDishes ? (
        <EmptyDishState mode={mode} isSearchEmpty={false} />
      ) : null}

      {!errorMessage && hasDishes && !hasResults ? (
        <EmptyDishState mode={mode} isSearchEmpty />
      ) : null}

      {!errorMessage && hasResults ? (
        <div className="space-y-5">
          {sections.map((section) => {
            const isExpanded = hasSearchQuery ? true : !collapsedSections[section.category];

            return (
              <section key={section.category} className="space-y-2.5">
                <SectionToggle
                  label={section.label}
                  count={section.dishes.length}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSection(section.category)}
                />

                {isExpanded ? (
                  <div className={sectionContentStackClassName}>
                    {section.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        mode={mode}
                        locale={locale}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
