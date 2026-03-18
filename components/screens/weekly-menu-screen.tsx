"use client";

import Link from "next/link";
import { useState } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AppLocale } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/provider";
import { getDishCategoryLabel, type DishSummary } from "@/lib/dishes";
import type {
  MealType,
  WeeklyMenuDayView,
  WeeklyMenuSlotDishDetails,
  WeeklyMenuSlotView,
  WeeklyMenuView,
} from "@/lib/weekly-menu";

const twoLineClampStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  overflow: "hidden",
};

function getDishNotePresentation(note?: string) {
  const normalizedNote = note?.trim();

  if (!normalizedNote) {
    return {
      practicalNote: undefined,
      supplementaryNote: undefined,
    };
  }

  const practicalCuePattern =
    /\b(fridge|freezer|store|reheat|serve|overnight|prep ahead|leftover|leftovers|rest|before serving|room temperature|marinate|drain|soak|preheat|cover|uncover|stir|mix in|let it sit|cool completely)\b/i;
  const instructionLikeStartPattern =
    /^(serve|store|reheat|keep|let|stir|mix|drain|soak|preheat|cover|uncover|marinate|cool|rest)\b/i;
  const isPracticalNote =
    practicalCuePattern.test(normalizedNote) ||
    instructionLikeStartPattern.test(normalizedNote);

  return {
    practicalNote: isPracticalNote ? normalizedNote : undefined,
    supplementaryNote: isPracticalNote ? undefined : normalizedNote,
  };
}

function getInitialActiveDayIndex(days: WeeklyMenuDayView[]) {
  return days.find((day) => day.isToday)?.dayIndex ?? days[0]?.dayIndex ?? 0;
}

function WeeklyMenuHero({
  weekLabel,
  hasMealPlan,
  title,
  withMealPlanText,
  emptyText,
}: {
  weekLabel: string;
  hasMealPlan: boolean;
  title: string;
  withMealPlanText: string;
  emptyText: string;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white via-cream to-almond px-4 py-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-2 max-w-[34ch] text-sm leading-6 text-cocoa">
            {hasMealPlan ? withMealPlanText : emptyText}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink">
          {weekLabel}
        </span>
      </div>
    </section>
  );
}

function DayOverviewButton({
  day,
  isActive,
  onSelect,
}: {
  day: WeeklyMenuDayView;
  isActive: boolean;
  onSelect: (dayIndex: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!isActive) {
          onSelect(day.dayIndex);
        }
      }}
      aria-pressed={isActive}
      className={[
        "rounded-2xl border px-2 py-3 text-center transition",
        isActive
          ? "border-clay/25 bg-white text-ink shadow-sm ring-2 ring-blush/90"
          : day.isToday
            ? "border-blush/60 bg-blush/55 text-ink"
            : "border-transparent bg-sand/60 text-cocoa",
      ].join(" ")}
    >
      <p
        className={[
          "text-[11px] uppercase tracking-[0.12em]",
          isActive ? "font-bold" : "font-semibold",
        ].join(" ")}
      >
        {day.shortLabel}
      </p>
      <p className="mt-1 text-sm font-semibold">{day.dateNumber}</p>
      <p
        className={[
          "mt-2 text-[10px]",
          isActive ? "text-cocoa" : "text-cocoa/80",
        ].join(" ")}
      >
        {day.filledMeals}/{day.slots.length}
      </p>
    </button>
  );
}

function SlotButton({
  slot,
  onOpen,
  chooseDishLabel,
  pickLabel,
  archivedLabel,
}: {
  slot: WeeklyMenuSlotView;
  onOpen: () => void;
  chooseDishLabel: string;
  pickLabel: string;
  archivedLabel: string;
}) {
  const isFilled = Boolean(slot.dishId);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition active:translate-y-px",
        isFilled
          ? "border border-white/80 bg-white shadow-sm hover:bg-white/90"
          : "border border-dashed border-clay/35 bg-sand/45 hover:bg-sand/70",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cocoa">
          {slot.mealLabel}
        </p>
        <p
          className={[
            "mt-1 break-words pr-1 text-sm leading-5",
            isFilled ? "font-semibold text-ink" : "text-cocoa",
          ].join(" ")}
          style={twoLineClampStyle}
        >
          {slot.dishName ?? chooseDishLabel}
        </p>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {slot.isArchivedDish ? (
          <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-semibold text-cocoa">
            {archivedLabel}
          </span>
        ) : null}
        {isFilled ? (
          <span className="inline-flex items-center text-cocoa/70">
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
        ) : (
          <span className="rounded-full border border-clay/40 px-3 py-1 text-[11px] font-semibold text-clay">
            {pickLabel}
          </span>
        )}
      </div>
    </button>
  );
}

function DayCard({
  day,
  onOpenSlot,
  noMealsAssignedText,
  mealsAssignedText,
  todayLabel,
  chooseDishLabel,
  pickLabel,
  archivedLabel,
}: {
  day: WeeklyMenuDayView;
  onOpenSlot: (slot: WeeklyMenuSlotView) => void;
  noMealsAssignedText: string;
  mealsAssignedText: string;
  todayLabel: string;
  chooseDishLabel: string;
  pickLabel: string;
  archivedLabel: string;
}) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-sand/70 bg-white/45 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-ink">
              {day.label}
              <span className="ml-2 text-sm font-medium text-cocoa">
                {day.dateLabel}
              </span>
            </p>
            <p className="mt-1 text-xs text-cocoa">
              {day.filledMeals === 0 ? noMealsAssignedText : mealsAssignedText}
            </p>
          </div>

          {day.isToday ? (
            <span className="rounded-full bg-leaf/15 px-3 py-1 text-[11px] font-semibold text-leaf">
              {todayLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 px-4 py-4">
        {day.slots.map((slot) => (
          <SlotButton
            key={slot.mealType}
            slot={slot}
            onOpen={() => onOpenSlot(slot)}
            chooseDishLabel={chooseDishLabel}
            pickLabel={pickLabel}
            archivedLabel={archivedLabel}
          />
        ))}
      </div>
    </SurfaceCard>
  );
}

function SlotSheet({
  children,
  onClose,
  closeAriaLabel,
}: {
  children: React.ReactNode;
  onClose: () => void;
  closeAriaLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={closeAriaLabel}
        onClick={onClose}
        className="absolute inset-0 bg-cocoa/30 backdrop-blur-[2px]"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[2rem] border border-white/70 bg-paper-glow px-4 pb-5 pt-4 shadow-shell">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-sand" />
        {children}
      </div>
    </div>
  );
}

function SlotSheetHeader({
  eyebrow,
  day,
  slot,
  onClose,
  closeLabel,
  archivedDishLabel,
}: {
  eyebrow: string;
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  onClose: () => void;
  closeLabel: string;
  archivedDishLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-semibold leading-none text-ink">
          {day.label}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
            {day.dateLabel}
          </span>
          <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink">
            {slot.mealLabel}
          </span>
          {slot.isArchivedDish ? (
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
              {archivedDishLabel}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-cocoa shadow-sm"
      >
        {closeLabel}
      </button>
    </div>
  );
}

function DetailSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={`bg-white/85 ${className}`.trim()}>
      <p className="text-sm font-semibold tracking-[0.01em] text-ink">{title}</p>
      <div className="mt-2.5 text-sm leading-6 text-cocoa">{children}</div>
    </SurfaceCard>
  );
}

function MetadataBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-sand/70 bg-sand/35 px-3 py-1 text-[11px] font-medium text-cocoa">
      {children}
    </span>
  );
}

function IngredientsList({
  ingredients,
  emptyText,
}: {
  ingredients: WeeklyMenuSlotDishDetails["ingredients"];
  emptyText: string;
}) {
  if (ingredients.length === 0) {
    return <p>{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-sand/70">
      {ingredients.map((ingredient) => (
        <div
          key={ingredient.id}
          className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <p className="min-w-0 break-words pr-3 text-sm font-semibold text-ink">
            {ingredient.name}
          </p>
          <span className="shrink-0 text-sm font-semibold text-cocoa">
            {ingredient.quantity} {ingredient.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecipeBlock({
  recipeText,
  emptyText,
}: {
  recipeText: string;
  emptyText: string;
}) {
  const normalizedText = recipeText.trim();
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasStepLikeStructure = /[\r\n]/.test(normalizedText) && lines.length > 1;

  if (!normalizedText) {
    return <p>{emptyText}</p>;
  }

  if (!hasStepLikeStructure) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-cocoa">
        {normalizedText}
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {lines.map((line, index) => (
        <li
          key={`${index + 1}-${line}`}
          className="flex items-start gap-3 border-b border-sand/70 py-2 last:border-b-0 last:pb-0 first:pt-0"
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand/70 text-[11px] font-semibold text-cocoa">
            {index + 1}
          </span>
          <p className="min-w-0 break-words pt-0.5 text-sm leading-6 text-cocoa">
            {line}
          </p>
        </li>
      ))}
    </ol>
  );
}

function DishDetailsSheet({
  day,
  slot,
  clearAction,
  onReplace,
  onClose,
  locale,
}: {
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  clearAction: (formData: FormData) => Promise<void>;
  onReplace: () => void;
  onClose: () => void;
  locale: AppLocale;
}) {
  const t = useT();
  const dishDetails = slot.dishDetails;
  const dishTitle =
    dishDetails?.name ?? slot.dishName ?? t("weeklyMenu.details.fallbackTitle");
  const showCategory = dishDetails
    ? getDishCategoryLabel(dishDetails.category, locale)
    : null;
  const showArchivedBadge = dishDetails?.isArchived ?? slot.isArchivedDish;
  const { practicalNote, supplementaryNote } = getDishNotePresentation(
    dishDetails?.comment,
  );

  function confirmClear(event: React.FormEvent<HTMLFormElement>) {
    const shouldClear = window.confirm(
      t("weeklyMenu.details.confirmClear", {
        mealLabel: slot.mealLabel.toLowerCase(),
        dayLabel: day.label,
        dateLabel: day.dateLabel,
      }),
    );

    if (!shouldClear) {
      event.preventDefault();
    }
  }

  return (
    <SlotSheet
      onClose={onClose}
      closeAriaLabel={t("weeklyMenu.sheet.closeAriaLabel")}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/70 bg-paper-glow/95 pb-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
                {t("weeklyMenu.details.title")}
              </p>
              <h2 className="mt-1.5 break-words font-[var(--font-heading)] text-3xl font-semibold leading-none text-ink">
                {dishTitle}
              </h2>
              <p className="mt-2 text-xs font-medium tracking-[0.01em] text-cocoa">
                {day.label}, {day.dateLabel}
                <span className="px-1.5 text-cocoa/60">/</span>
                {slot.mealLabel}
              </p>

              {(showCategory || showArchivedBadge) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {showCategory ? <MetadataBadge>{showCategory}</MetadataBadge> : null}
                  {showArchivedBadge ? (
                    <MetadataBadge>{t("weeklyMenu.details.archived")}</MetadataBadge>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-cocoa shadow-sm"
            >
              {t("common.actions.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pt-3 pr-1">
          <div className="space-y-3">
            {dishDetails ? (
              <>
                {practicalNote ? (
                  <SurfaceCard className="border-leaf/20 bg-leaf/10">
                    <p className="text-sm font-semibold text-ink">
                      {t("weeklyMenu.details.cookNote")}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-cocoa">
                      {practicalNote}
                    </p>
                  </SurfaceCard>
                ) : null}

                <DetailSection
                  title={t("weeklyMenu.details.ingredients")}
                  className="bg-white/92"
                >
                  <IngredientsList
                    ingredients={dishDetails.ingredients}
                    emptyText={t("weeklyMenu.details.noIngredients")}
                  />
                </DetailSection>

                {dishDetails.recipeText ? (
                  <DetailSection title={t("weeklyMenu.details.howToCook")}>
                    <RecipeBlock
                      recipeText={dishDetails.recipeText}
                      emptyText={t("weeklyMenu.details.noCookingSteps")}
                    />
                  </DetailSection>
                ) : null}

                {supplementaryNote ? (
                  <DetailSection title={t("weeklyMenu.details.notes")}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-cocoa">
                      {supplementaryNote}
                    </p>
                  </DetailSection>
                ) : null}
              </>
            ) : (
              <SurfaceCard className="bg-white/85">
                <p className="text-sm font-semibold text-ink">
                  {t("weeklyMenu.details.unavailable.title")}
                </p>
                <p className="mt-2 text-sm leading-6 text-cocoa">
                  {t("weeklyMenu.details.unavailable.description")}
                </p>
              </SurfaceCard>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/70 bg-paper-glow/95 pt-3 backdrop-blur-sm">
          <div className="rounded-[1.4rem] bg-white/88 p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onReplace}
                className="w-full rounded-2xl border border-clay/20 bg-sand/55 px-4 py-3 text-sm font-semibold text-ink"
              >
                {t("weeklyMenu.details.replace")}
              </button>

              <form action={clearAction} onSubmit={confirmClear}>
                <input type="hidden" name="dayIndex" value={day.dayIndex} />
                <input type="hidden" name="mealType" value={slot.mealType} />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-clay/25 bg-white px-4 py-3 text-sm font-semibold text-clay"
                >
                  {t("common.actions.clear")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SlotSheet>
  );
}

function DishPicker({
  day,
  slot,
  dishes,
  assignAction,
  onBack,
  onClose,
  locale,
}: {
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  dishes: DishSummary[];
  assignAction: (formData: FormData) => Promise<void>;
  onBack?: () => void;
  onClose: () => void;
  locale: AppLocale;
}) {
  const t = useT();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDishes = dishes.filter((dish) => {
    if (!normalizedQuery) {
      return true;
    }

    return [dish.name, getDishCategoryLabel(dish.category, locale), dish.summary]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <SlotSheet
      onClose={onClose}
      closeAriaLabel={t("weeklyMenu.sheet.closeAriaLabel")}
    >
      <SlotSheetHeader
        eyebrow={
          slot.dishId
            ? t("weeklyMenu.picker.replaceEyebrow")
            : t("weeklyMenu.picker.eyebrow")
        }
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedDishLabel={t("weeklyMenu.details.archived")}
      />

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-cocoa shadow-sm"
        >
          {t("weeklyMenu.picker.backToDetails")}
        </button>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 pr-1">
        {dishes.length > 0 ? (
          <label className="block">
            <span className="sr-only">{t("weeklyMenu.picker.searchLabel")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("weeklyMenu.picker.searchPlaceholder")}
              className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-cocoa/55"
            />
          </label>
        ) : null}

        {dishes.length === 0 ? (
          <SurfaceCard className="mt-4 bg-white/85">
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.picker.empty.title")}
            </p>
            <p className="mt-2 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.picker.empty.description")}
            </p>
            <Link
              href="/dishes/new"
              className="mt-4 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
            >
              {t("weeklyMenu.picker.empty.cta")}
            </Link>
          </SurfaceCard>
        ) : null}

        {dishes.length > 0 && filteredDishes.length === 0 ? (
          <SurfaceCard className="mt-4 bg-white/85">
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.picker.noResults.title")}
            </p>
            <p className="mt-2 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.picker.noResults.description")}
            </p>
          </SurfaceCard>
        ) : null}

        {filteredDishes.length > 0 ? (
          <div className="mt-4 space-y-3">
            {filteredDishes.map((dish) => (
              <form key={dish.id} action={assignAction} onSubmit={() => onClose()}>
                <input type="hidden" name="dayIndex" value={day.dayIndex} />
                <input type="hidden" name="mealType" value={slot.mealType} />
                <input type="hidden" name="dishId" value={dish.id} />
                <button
                  type="submit"
                  className="w-full rounded-[1.4rem] border border-white/80 bg-white/90 px-4 py-3 text-left shadow-sm transition hover:bg-white"
                >
                  <p className="break-words text-sm font-semibold leading-5 text-ink">
                    {dish.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-clay">
                    {getDishCategoryLabel(dish.category, locale)}
                  </p>
                  {dish.summary ? (
                    <p
                      className="mt-2 break-words text-sm leading-6 text-cocoa"
                      style={twoLineClampStyle}
                    >
                      {dish.summary}
                    </p>
                  ) : null}
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </SlotSheet>
  );
}

export function WeeklyMenuScreen({
  menu,
  dishes,
  assignAction,
  clearAction,
  errorMessage,
}: {
  menu: WeeklyMenuView;
  dishes: DishSummary[];
  assignAction: (formData: FormData) => Promise<void>;
  clearAction: (formData: FormData) => Promise<void>;
  errorMessage?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [sheetState, setSheetState] = useState<{
    dayIndex: number;
    mealType: MealType;
    mode: "picker" | "details";
  } | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(() =>
    getInitialActiveDayIndex(menu.days),
  );

  const activeDay =
    menu.days.find((day) => day.dayIndex === activeDayIndex) ?? menu.days[0];
  const selectedDay = menu.days.find((day) => day.dayIndex === sheetState?.dayIndex);
  const selectedSlot = selectedDay?.slots.find(
    (slot) => slot.mealType === sheetState?.mealType,
  );
  const mealsAssignedText = activeDay
    ? t("weeklyMenu.day.mealsAssigned", {
        filled: activeDay.filledMeals,
        total: activeDay.slots.length,
      })
    : "";

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={t("weeklyMenu.header.eyebrow")}
        title={t("weeklyMenu.header.title")}
        description={t("weeklyMenu.header.description")}
      />

      <WeeklyMenuHero
        weekLabel={menu.weekLabel}
        hasMealPlan={menu.hasMealPlan}
        title={t("weeklyMenu.hero.title")}
        withMealPlanText={t("weeklyMenu.hero.withMealPlan")}
        emptyText={t("weeklyMenu.hero.empty")}
      />

      {errorMessage ? (
        <SurfaceCard className="border-clay/20 bg-white/90">
          <p className="text-sm font-semibold text-ink">
            {t("weeklyMenu.errors.title")}
          </p>
          <p className="mt-2 text-sm leading-6 text-cocoa">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {t("weeklyMenu.errors.retry")}
          </button>
        </SurfaceCard>
      ) : null}

      {!errorMessage ? (
        <>
          <SurfaceCard className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {t("weeklyMenu.overview.title")}
                </p>
                <p className="mt-1 text-sm text-cocoa">
                  {t("weeklyMenu.overview.description")}
                </p>
              </div>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
                {menu.filledSlots}/{menu.totalSlots}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {menu.days.map((day) => (
                <DayOverviewButton
                  key={day.isoDate}
                  day={day}
                  isActive={day.dayIndex === activeDay?.dayIndex}
                  onSelect={setActiveDayIndex}
                />
              ))}
            </div>
          </SurfaceCard>

          {dishes.length === 0 ? (
            <SurfaceCard className="bg-white/85">
              <p className="text-sm font-semibold text-ink">
                {t("weeklyMenu.empty.title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-cocoa">
                {t("weeklyMenu.empty.description")}
              </p>
              <Link
                href="/dishes/new"
                className="mt-4 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
              >
                {t("weeklyMenu.empty.cta")}
              </Link>
            </SurfaceCard>
          ) : null}

          {activeDay ? (
            <DayCard
              day={activeDay}
              onOpenSlot={(slot) =>
                setSheetState({
                  dayIndex: activeDay.dayIndex,
                  mealType: slot.mealType,
                  mode: slot.dishId ? "details" : "picker",
                })
              }
              noMealsAssignedText={t("weeklyMenu.day.noMealsAssigned")}
              mealsAssignedText={mealsAssignedText}
              todayLabel={t("weeklyMenu.day.today")}
              chooseDishLabel={t("weeklyMenu.slot.chooseDish")}
              pickLabel={t("weeklyMenu.slot.pick")}
              archivedLabel={t("weeklyMenu.slot.archived")}
            />
          ) : null}
        </>
      ) : null}

      {selectedDay && selectedSlot && sheetState?.mode === "details" ? (
        <DishDetailsSheet
          day={selectedDay}
          slot={selectedSlot}
          clearAction={clearAction}
          onReplace={() =>
            setSheetState((current) =>
              current
                ? {
                    ...current,
                    mode: "picker",
                  }
                : current,
            )
          }
          onClose={() => setSheetState(null)}
          locale={locale}
        />
      ) : null}

      {selectedDay && selectedSlot && sheetState?.mode === "picker" ? (
        <DishPicker
          day={selectedDay}
          slot={selectedSlot}
          dishes={dishes}
          assignAction={assignAction}
          onBack={
            selectedSlot.dishId
              ? () =>
                  setSheetState((current) =>
                    current
                      ? {
                          ...current,
                          mode: "details",
                        }
                      : current,
                  )
              : undefined
          }
          onClose={() => setSheetState(null)}
          locale={locale}
        />
      ) : null}
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/70 ${className}`} />;
}

export function WeeklyMenuScreenSkeleton() {
  const t = useT();

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={t("weeklyMenu.header.eyebrow")}
        title={t("weeklyMenu.header.title")}
        description={t("weeklyMenu.header.description")}
      />

      <WeeklyMenuHero
        weekLabel="..."
        hasMealPlan={false}
        title={t("weeklyMenu.hero.title")}
        withMealPlanText={t("weeklyMenu.hero.withMealPlan")}
        emptyText={t("weeklyMenu.hero.empty")}
      />

      <SurfaceCard className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-44" />
          </div>
          <SkeletonBlock className="h-7 w-14 rounded-full" />
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={`overview-skeleton-${index + 1}`}
              className="rounded-2xl border border-transparent bg-sand/50 px-2 py-3"
            >
              <SkeletonBlock className="mx-auto h-3 w-7" />
              <SkeletonBlock className="mx-auto mt-2 h-4 w-5" />
              <SkeletonBlock className="mx-auto mt-2 h-3 w-7" />
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-sand/70 bg-white/45 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <SkeletonBlock className="h-7 w-14 rounded-full" />
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`slot-skeleton-${index + 1}`}
              className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-sm"
            >
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="mt-3 h-4 w-40" />
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
