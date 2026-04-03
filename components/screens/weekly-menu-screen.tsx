"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  backActionClassName,
  countPillClassName,
  errorSurfaceClassName,
  infoCardClassName,
  inlineNoticeClassName,
  metaPillClassName,
  stateSurfaceBadgeClassName,
  stateSurfaceBodyClassName,
  stateSurfaceClassName,
  stateSurfaceDescriptionClassName,
  stateSurfaceTitleClassName,
  topSurfaceClassName,
  topSurfaceDescriptionClassName,
  topSurfaceIntroClassName,
} from "@/components/ui/presentation";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AppLocale } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/provider";
import { getDishCategoryLabel, type DishSummary } from "@/lib/dishes";
import {
  formatShoppingListCopy,
  getShoppingFlowState,
  getShoppingListCopy,
} from "@/lib/shopping-list-copy";
import type { CurrentWeekShoppingListSummary } from "@/lib/shopping-list-read";
import {
  getWeeklyMenuSlotPrimaryItem,
  type MealType,
  type WeeklyMenuDayView,
  type WeeklyMenuSlotDishDetails,
  type WeeklyMenuSlotItemView,
  type WeeklyMenuSlotView,
  type WeeklyMenuView,
} from "@/lib/weekly-menu";

type WeeklyMenuSlotMutationResult =
  | {
      status: "success";
      slotIsEmpty?: boolean;
    }
  | {
      status: "error";
      code:
        | "duplicate_dish_in_slot"
        | "slot_item_not_found"
        | "slot_not_found"
        | "slot_not_empty"
        | "dish_not_available"
        | "failed";
    };

type WeeklyMenuSlotMutationErrorCode = Extract<
  WeeklyMenuSlotMutationResult,
  { status: "error" }
>["code"];

type ReuseMode = "item" | "slot";

type ReuseTargetOption = {
  dayIndex: number;
  mealType: MealType;
  mealLabel: string;
  isAvailable: boolean;
  statusLabel: string;
  summaryLabel: string;
};

type ReuseTargetDay = {
  day: WeeklyMenuDayView;
  availableCount: number;
  targets: ReuseTargetOption[];
};

const twoLineClampStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const sheetTitleClassName =
  "break-words font-[var(--font-heading)] text-[2rem] font-semibold leading-[0.98] text-ink";

const sheetScrollAreaClassName =
  "mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-1";

const sheetFooterClassName =
  "shrink-0 border-t border-white/70 bg-paper-glow/95 pt-3.5 backdrop-blur-sm";

const sheetFooterCardClassName = "rounded-[1.4rem] bg-white/84 p-3 shadow-sm";

const archivedStatePillClassName =
  "rounded-full border border-sand/80 bg-white/82 px-3 py-1 text-[11px] font-medium text-cocoa/84";

const slotItemActionDividerClassName = "mt-3 border-t border-sand/60 pt-3";

const slotItemActionRowClassName = "mt-2 flex min-w-0 flex-nowrap items-center gap-1.5";

const slotItemPrimaryActionClassName =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-clay/18 bg-sand/58 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-sand/72 disabled:opacity-60";

const slotItemSecondaryActionClassName =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-clay/18 bg-white/84 px-3 py-2 text-sm font-semibold text-cocoa transition hover:bg-white disabled:opacity-60";

const slotItemTrailingActionClassName =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-semibold text-clay transition hover:bg-white/72 disabled:opacity-60";

const slotItemContextActionClassName =
  "inline-flex items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold text-clay transition hover:bg-white/72 disabled:opacity-60";

const slotFooterSecondaryActionClassName =
  "inline-flex items-center justify-center self-center rounded-full border border-clay/18 bg-white/84 px-4 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-white disabled:opacity-60";

const slotDetailsPrimaryActionClassName =
  "w-full rounded-[1.2rem] border border-clay/20 bg-sand/55 px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60";

const slotDetailsSecondaryActionsClassName = "mt-2 grid grid-cols-2 gap-2";

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

function getReuseTargetSummary(slot: WeeklyMenuSlotView, t: ReturnType<typeof useT>) {
  if (slot.items.length === 0) {
    return t("weeklyMenu.reuse.emptyTarget");
  }

  return t("weeklyMenu.reuse.filledTarget", {
    count: slot.items.length,
  });
}

function buildReuseTargetDays(args: {
  days: WeeklyMenuDayView[];
  sourceDayIndex: number;
  sourceMealType: MealType;
  mode: ReuseMode;
  sourceDishId?: string;
  t: ReturnType<typeof useT>;
}) {
  return args.days.map((day) => {
    const targets = day.slots.map((slot) => {
      const isSourceSlot =
        day.dayIndex === args.sourceDayIndex && slot.mealType === args.sourceMealType;
      let isAvailable = true;
      let statusLabel = getReuseTargetSummary(slot, args.t);

      if (isSourceSlot) {
        isAvailable = false;
        statusLabel = args.t("weeklyMenu.reuse.currentSlot");
      } else if (args.mode === "slot") {
        if (slot.items.length > 0) {
          isAvailable = false;
          statusLabel = args.t("weeklyMenu.reuse.targetRequiresEmpty");
        }
      } else if (
        args.sourceDishId &&
        slot.items.some((item) => item.dishId === args.sourceDishId)
      ) {
        isAvailable = false;
        statusLabel = args.t("weeklyMenu.reuse.targetAlreadyContainsDish");
      }

      return {
        dayIndex: day.dayIndex,
        mealType: slot.mealType,
        mealLabel: slot.mealLabel,
        isAvailable,
        statusLabel,
        summaryLabel: getReuseTargetSummary(slot, args.t),
      } satisfies ReuseTargetOption;
    });

    return {
      day,
      availableCount: targets.filter((target) => target.isAvailable).length,
      targets,
    } satisfies ReuseTargetDay;
  });
}

function getInitialReuseTargetDayIndex(targetDays: ReuseTargetDay[]) {
  return (
    targetDays.find((targetDay) => targetDay.availableCount > 0)?.day.dayIndex ??
    targetDays[0]?.day.dayIndex ??
    0
  );
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
    <section className={topSurfaceClassName}>
      <div className="flex items-start justify-between gap-4">
        <div className={topSurfaceIntroClassName}>
          <p className="text-base font-semibold text-ink">{title}</p>
          <p className={topSurfaceDescriptionClassName}>
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
  const primaryItem = getWeeklyMenuSlotPrimaryItem(slot);
  const isFilled = slot.items.length > 0;
  const visibleItemNames = slot.items.slice(0, 2).map((item) => item.dishName);
  const overflowCount = Math.max(slot.items.length - visibleItemNames.length, 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "flex w-full items-center justify-between rounded-[1.35rem] px-3.5 py-3.5 text-left transition active:translate-y-px",
        isFilled
          ? "border border-white/80 bg-white shadow-sm hover:bg-white/90"
          : "border border-dashed border-clay/35 bg-sand/45 hover:bg-sand/70",
      ].join(" ")}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cocoa/82">
          {slot.mealLabel}
        </p>
        {!isFilled ? (
          <p
            className="break-words pr-1 text-sm leading-5 text-cocoa"
            style={twoLineClampStyle}
          >
            {chooseDishLabel}
          </p>
        ) : visibleItemNames.length === 1 ? (
          <p
            className="break-words pr-1 text-sm font-semibold leading-5 text-ink"
            style={twoLineClampStyle}
          >
            {primaryItem?.dishName}
          </p>
        ) : (
          <div className="space-y-1.5 pr-1">
            {visibleItemNames.map((itemName, index) => (
              <p
                key={`${slot.mealType}-summary-${index + 1}`}
                className="break-words text-sm font-semibold leading-5 text-ink"
              >
                {itemName}
              </p>
            ))}
            {overflowCount > 0 ? (
              <p className="text-[11px] font-semibold leading-5 text-cocoa/82">
                +{overflowCount} more
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-2.5">
        {slot.hasArchivedItems ? (
          <span className={archivedStatePillClassName}>
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
          <span className="rounded-full border border-clay/35 bg-white/72 px-3 py-1 text-[11px] font-semibold text-clay">
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
      <div className="border-b border-sand/70 bg-white/45 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-ink">
              {day.label}
              <span className="ml-2 text-sm font-medium text-cocoa">
                {day.dateLabel}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-cocoa/84">
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

      <div className="space-y-2.5 px-4 py-4">
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

function ProductsBridgeRow({
  hasMealPlan,
  shoppingSummary,
}: {
  hasMealPlan: boolean;
  shoppingSummary: CurrentWeekShoppingListSummary | null;
}) {
  const t = useT();
  const { locale } = useLocale();
  const shoppingListCopy = getShoppingListCopy(locale);
  const totalItems = shoppingSummary?.totalItems ?? 0;
  const toBuyCount = shoppingSummary?.toBuyCount ?? 0;
  const boughtCount = shoppingSummary?.boughtCount ?? 0;
  const hasItems = totalItems > 0;
  const flowState = getShoppingFlowState({
    hasMealPlan,
    isSyncPending: shoppingSummary?.isSyncPending ?? false,
    totalItems,
    toBuyCount,
    boughtCount,
  });
  const description = shoppingListCopy.flow.bridge[flowState];
  const toBuyBadgeClass =
    toBuyCount > 0
      ? "bg-blush/70 text-ink"
      : "bg-white/90 text-cocoa shadow-sm";
  const boughtBadgeClass =
    boughtCount > 0
      ? "bg-leaf/12 text-leaf"
      : "bg-white/90 text-cocoa shadow-sm";

  return (
    <Link href="/products" prefetch={false} className="block">
      <SurfaceCard className="bg-white/72 px-4 py-3 transition hover:bg-white/88 active:translate-y-px">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sand/80 text-xs font-bold text-cocoa">
            {t("navigation.badges.products")}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {shoppingListCopy.header.title}
              </p>
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
            </div>

            <p className="mt-1 break-words text-sm leading-6 text-cocoa">
              {description}
            </p>

            {hasItems ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${toBuyBadgeClass}`}
                >
                  {formatShoppingListCopy(shoppingListCopy.summary.toBuy, {
                    count: toBuyCount,
                  })}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${boughtBadgeClass}`}
                >
                  {formatShoppingListCopy(shoppingListCopy.summary.bought, {
                    count: boughtCount,
                  })}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </Link>
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

      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[2.1rem] border border-white/70 bg-paper-glow px-4 pb-5 pt-3.5 shadow-shell">
        <div className="mx-auto mb-3.5 h-1.5 w-12 rounded-full bg-sand" />
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
  archivedLabel,
  showArchivedBadge = true,
}: {
  eyebrow: string;
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  onClose: () => void;
  closeLabel: string;
  archivedLabel: string;
  showArchivedBadge?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3.5">
      <div className="min-w-0 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
          {eyebrow}
        </p>
        <h2 className={sheetTitleClassName}>
          {day.label}
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className={metaPillClassName}>
            {day.dateLabel}
          </span>
          <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink">
            {slot.mealLabel}
          </span>
          {showArchivedBadge && slot.hasArchivedItems ? (
            <span className={archivedStatePillClassName}>
              {archivedLabel}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={`shrink-0 ${backActionClassName}`}
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
    <SurfaceCard className={`${infoCardClassName} ${className}`.trim()}>
      <p className="text-sm font-semibold tracking-[0.01em] text-ink">{title}</p>
      <div className="mt-3 text-sm leading-6 text-cocoa">{children}</div>
    </SurfaceCard>
  );
}

function MetadataBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-sand/70 bg-sand/30 px-3 py-1 text-[11px] font-medium text-cocoa">
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
  const primaryItem = getWeeklyMenuSlotPrimaryItem(slot);
  const dishDetails = primaryItem?.dishDetails;
  const dishTitle =
    dishDetails?.name ?? primaryItem?.dishName ?? t("weeklyMenu.details.fallbackTitle");
  const showCategory = dishDetails
    ? getDishCategoryLabel(dishDetails.category, locale)
    : null;
  const showArchivedBadge = dishDetails?.isArchived ?? primaryItem?.isArchivedDish ?? false;
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
          slot.items.length > 0
            ? t("weeklyMenu.picker.replaceEyebrow")
            : t("weeklyMenu.picker.eyebrow")
        }
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedLabel={t("weeklyMenu.slot.archived")}
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
                prefetch={false}
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

function SlotFlowNotice({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <SurfaceCard className={`mt-4 ${inlineNoticeClassName}`}>
      <p className="text-sm leading-6 text-cocoa">{message}</p>
    </SurfaceCard>
  );
}

function SlotOverviewPanel({
  day,
  slot,
  onOpenDetails,
  onAdd,
  onReplace,
  onReuseItem,
  onReuseSlot,
  onRemove,
  onClose,
  feedbackMessage,
  isPending,
  locale,
}: {
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  onOpenDetails: (slotItemId: string) => void;
  onAdd: () => void;
  onReplace: (slotItemId: string) => void;
  onReuseItem: (slotItemId: string) => void;
  onReuseSlot: () => void;
  onRemove: (slotItemId: string) => void;
  onClose: () => void;
  feedbackMessage: string | null;
  isPending: boolean;
  locale: AppLocale;
}) {
  const t = useT();
  const hasItems = slot.items.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SlotSheetHeader
        eyebrow={t("weeklyMenu.slotFlow.eyebrow")}
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedLabel={t("weeklyMenu.slot.archived")}
      />

      <SlotFlowNotice message={feedbackMessage} />

      <div className={sheetScrollAreaClassName}>
        {!hasItems ? (
          <SurfaceCard className={infoCardClassName}>
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.slotFlow.emptyTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.slotFlow.emptyDescription")}
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-3.5">
            {slot.items.map((item, index) => {
              const categoryLabel = item.dishDetails
                ? getDishCategoryLabel(item.dishDetails.category, locale)
                : null;

              return (
                <SurfaceCard key={item.id} className="bg-white/88">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(item.id)}
                    disabled={isPending}
                    className="w-full text-left disabled:opacity-70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
                          {slot.mealLabel} {index + 1}
                        </p>
                        <p className="break-words text-sm font-semibold leading-5 text-ink">
                          {item.dishName}
                        </p>
                        {(categoryLabel || item.isArchivedDish) ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {categoryLabel ? (
                              <p className="text-xs font-medium text-cocoa/82">
                                {categoryLabel}
                              </p>
                            ) : null}
                            {item.isArchivedDish ? (
                              <MetadataBadge>{t("weeklyMenu.details.archived")}</MetadataBadge>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

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
                    </div>
                  </button>

                  <div className={slotItemActionDividerClassName}>
                    <div className={slotItemActionRowClassName}>
                      <button
                        type="button"
                        onClick={() => onReplace(item.id)}
                        disabled={isPending}
                        className={slotItemPrimaryActionClassName}
                      >
                        {t("weeklyMenu.details.replace")}
                      </button>

                      {!item.isArchivedDish ? (
                        <button
                          type="button"
                          onClick={() => onReuseItem(item.id)}
                          disabled={isPending}
                          className={slotItemSecondaryActionClassName}
                        >
                          {t("weeklyMenu.reuse.itemAction")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={isPending}
                        className={slotItemTrailingActionClassName}
                      >
                        {t("weeklyMenu.slotFlow.remove")}
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        )}

        {slot.hasArchivedItems ? (
          <SurfaceCard className="mt-3 border-sand/75 bg-sand/18">
            <p className="text-sm leading-6 text-cocoa">
              {t("weeklyMenu.reuse.archivedSlotNotice")}
            </p>
          </SurfaceCard>
        ) : null}
      </div>

      <div className={sheetFooterClassName}>
        <div className={`${sheetFooterCardClassName} space-y-2.5`}>
          <button
            type="button"
            onClick={onAdd}
            disabled={isPending}
            className="w-full rounded-[1.4rem] bg-clay px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {hasItems ? t("weeklyMenu.slotFlow.addMore") : t("weeklyMenu.slotFlow.addFirst")}
          </button>

          {hasItems && !slot.hasArchivedItems ? (
            <button
              type="button"
              onClick={onReuseSlot}
              disabled={isPending}
              className={slotFooterSecondaryActionClassName}
            >
              {t("weeklyMenu.reuse.slotAction")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SlotItemDetailsPanel({
  day,
  slot,
  slotItem,
  onBack,
  onReplace,
  onReuse,
  onRemove,
  onClose,
  isPending,
  locale,
}: {
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  slotItem: WeeklyMenuSlotItemView;
  onBack: () => void;
  onReplace: () => void;
  onReuse: () => void;
  onRemove: () => void;
  onClose: () => void;
  isPending: boolean;
  locale: AppLocale;
}) {
  const t = useT();
  const dishDetails = slotItem.dishDetails;
  const dishTitle =
    dishDetails?.name ?? slotItem.dishName ?? t("weeklyMenu.details.fallbackTitle");
  const showCategory = dishDetails
    ? getDishCategoryLabel(dishDetails.category, locale)
    : null;
  const showArchivedBadge = dishDetails?.isArchived ?? slotItem.isArchivedDish;
  const { practicalNote, supplementaryNote } = getDishNotePresentation(
    dishDetails?.comment,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SlotSheetHeader
        eyebrow={t("weeklyMenu.details.title")}
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedLabel={t("weeklyMenu.slot.archived")}
        showArchivedBadge={false}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={isPending}
        className={`mt-4 self-start disabled:opacity-60 ${backActionClassName}`}
      >
        {t("weeklyMenu.slotFlow.backToSlot")}
      </button>

      <div className={sheetScrollAreaClassName}>
        <div className="space-y-3.5">
          <SurfaceCard className={infoCardClassName}>
            <h2 className={sheetTitleClassName}>
              {dishTitle}
            </h2>
            {(showCategory || showArchivedBadge) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {showCategory ? <MetadataBadge>{showCategory}</MetadataBadge> : null}
                {showArchivedBadge ? (
                  <MetadataBadge>{t("weeklyMenu.details.archived")}</MetadataBadge>
                ) : null}
              </div>
            ) : null}
          </SurfaceCard>

          {dishDetails ? (
            <>
              {practicalNote ? (
                <SurfaceCard className="border-leaf/18 bg-leaf/9">
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
            <SurfaceCard className={infoCardClassName}>
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

      <div className={sheetFooterClassName}>
        <div className={sheetFooterCardClassName}>
          {slotItem.isArchivedDish ? (
            <p className="mb-3 rounded-[1.1rem] bg-sand/18 px-3 py-2.5 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.reuse.archivedDishNotice")}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onReplace}
            disabled={isPending}
            className={slotDetailsPrimaryActionClassName}
          >
            {t("weeklyMenu.details.replace")}
          </button>

          <div
            className={
              slotItem.isArchivedDish
                ? "mt-2 flex flex-wrap items-center gap-2"
                : slotDetailsSecondaryActionsClassName
            }
          >
            {!slotItem.isArchivedDish ? (
              <button
                type="button"
                onClick={onReuse}
                disabled={isPending}
                className="rounded-[1.1rem] border border-clay/18 bg-white/84 px-4 py-3 text-sm font-semibold text-cocoa disabled:opacity-60"
              >
                {t("weeklyMenu.reuse.itemAction")}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onRemove}
              disabled={isPending}
              className={
                slotItem.isArchivedDish
                  ? slotItemContextActionClassName
                  : "rounded-[1.1rem] border border-clay/18 bg-white/72 px-4 py-3 text-sm font-semibold text-clay disabled:opacity-60"
              }
            >
              {t("weeklyMenu.slotFlow.remove")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotDishPickerPanel({
  day,
  slot,
  dishes,
  replaceTargetItemId,
  onBack,
  onClose,
  onSelectDish,
  feedbackMessage,
  isPending,
  locale,
}: {
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  dishes: DishSummary[];
  replaceTargetItemId?: string;
  onBack: () => void;
  onClose: () => void;
  onSelectDish: (dishId: string) => void;
  feedbackMessage: string | null;
  isPending: boolean;
  locale: AppLocale;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const blockedDishIds = new Set(
    slot.items
      .filter((item) => item.id !== replaceTargetItemId)
      .map((item) => item.dishId),
  );
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
    <div className="flex min-h-0 flex-1 flex-col">
      <SlotSheetHeader
        eyebrow={
          replaceTargetItemId
            ? t("weeklyMenu.picker.replaceEyebrow")
            : t("weeklyMenu.picker.eyebrow")
        }
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedLabel={t("weeklyMenu.slot.archived")}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={isPending}
        className={`mt-4 self-start disabled:opacity-60 ${backActionClassName}`}
      >
        {t("weeklyMenu.slotFlow.backToSlot")}
      </button>

      <SlotFlowNotice message={feedbackMessage} />

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1 pr-1">
        {dishes.length > 0 ? (
          <label className="block">
            <span className="sr-only">{t("weeklyMenu.picker.searchLabel")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("weeklyMenu.picker.searchPlaceholder")}
              className="w-full rounded-[1.35rem] border border-white/75 bg-white/92 px-4 py-3 text-sm text-ink outline-none placeholder:text-cocoa/55"
            />
          </label>
        ) : null}

        {dishes.length === 0 ? (
          <SurfaceCard className={`mt-4 ${infoCardClassName}`}>
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.picker.empty.title")}
            </p>
            <p className="mt-2 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.picker.empty.description")}
            </p>
              <Link
                href="/dishes/new"
                prefetch={false}
                className="mt-4 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
              >
              {t("weeklyMenu.picker.empty.cta")}
            </Link>
          </SurfaceCard>
        ) : null}

        {dishes.length > 0 && filteredDishes.length === 0 ? (
          <SurfaceCard className={`mt-4 ${infoCardClassName}`}>
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.picker.noResults.title")}
            </p>
            <p className="mt-2 text-sm leading-6 text-cocoa">
              {t("weeklyMenu.picker.noResults.description")}
            </p>
          </SurfaceCard>
        ) : null}

        {filteredDishes.length > 0 ? (
          <div className="mt-4 space-y-2.5">
            {filteredDishes.map((dish) => {
              const isDuplicate = blockedDishIds.has(dish.id);

              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => onSelectDish(dish.id)}
                  disabled={isDuplicate || isPending}
                  className={[
                    "w-full rounded-[1.4rem] border px-4 py-3.5 text-left shadow-sm transition",
                    isDuplicate
                      ? "border-sand/80 bg-sand/45 text-cocoa/85"
                      : "border-white/80 bg-white/90 hover:bg-white",
                    isPending ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="break-words text-sm font-semibold leading-5 text-ink">
                        {dish.name}
                      </p>
                      <p className="text-xs font-medium text-clay">
                        {getDishCategoryLabel(dish.category, locale)}
                      </p>
                    </div>
                    {isDuplicate ? (
                      <span className={metaPillClassName}>
                        {t("weeklyMenu.slotFlow.alreadyInSlot")}
                      </span>
                    ) : null}
                  </div>
                  {dish.summary ? (
                    <p
                      className="mt-2 break-words text-sm leading-6 text-cocoa"
                      style={twoLineClampStyle}
                    >
                      {dish.summary}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SlotReusePickerPanel({
  menu,
  day,
  slot,
  slotItem,
  mode,
  onBack,
  onClose,
  onSelectTarget,
  feedbackMessage,
  isPending,
}: {
  menu: WeeklyMenuView;
  day: WeeklyMenuDayView;
  slot: WeeklyMenuSlotView;
  slotItem?: WeeklyMenuSlotItemView;
  mode: ReuseMode;
  onBack: () => void;
  onClose: () => void;
  onSelectTarget: (target: { dayIndex: number; mealType: MealType }) => void;
  feedbackMessage: string | null;
  isPending: boolean;
}) {
  const t = useT();
  const canReuse =
    mode === "slot"
      ? slot.items.length > 0 && !slot.hasArchivedItems
      : Boolean(slotItem && !slotItem.isArchivedDish);
  const targetDays = buildReuseTargetDays({
    days: menu.days,
    sourceDayIndex: day.dayIndex,
    sourceMealType: slot.mealType,
    mode,
    sourceDishId: mode === "item" ? slotItem?.dishId : undefined,
    t,
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    getInitialReuseTargetDayIndex(targetDays),
  );
  const selectedTargetDay =
    targetDays.find((targetDay) => targetDay.day.dayIndex === selectedDayIndex) ??
    targetDays[0];
  const noAvailableTargets = targetDays.every((targetDay) => targetDay.availableCount === 0);

  useEffect(() => {
    if (!selectedTargetDay) {
      return;
    }

    if (selectedTargetDay.availableCount > 0 || noAvailableTargets) {
      return;
    }

    const firstAvailableDay = targetDays.find((targetDay) => targetDay.availableCount > 0);

    if (firstAvailableDay && firstAvailableDay.day.dayIndex !== selectedDayIndex) {
      setSelectedDayIndex(firstAvailableDay.day.dayIndex);
    }
  }, [noAvailableTargets, selectedDayIndex, selectedTargetDay, targetDays]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SlotSheetHeader
        eyebrow={
          mode === "slot"
            ? t("weeklyMenu.reuse.slotEyebrow")
            : t("weeklyMenu.reuse.itemEyebrow")
        }
        day={day}
        slot={slot}
        onClose={onClose}
        closeLabel={t("common.actions.close")}
        archivedLabel={t("weeklyMenu.slot.archived")}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={isPending}
        className={`mt-4 self-start disabled:opacity-60 ${backActionClassName}`}
      >
        {t("weeklyMenu.reuse.backToSlot")}
      </button>

      <SlotFlowNotice message={feedbackMessage} />

      <div className={sheetScrollAreaClassName}>
        <div className="space-y-4">
          <SurfaceCard className={infoCardClassName}>
            <p className="text-sm font-semibold text-ink">
              {mode === "slot"
                ? t("weeklyMenu.reuse.sourceSlot")
                : t("weeklyMenu.reuse.sourceDish")}
            </p>
            <p className="mt-2 break-words text-sm font-semibold leading-6 text-ink">
              {mode === "slot" ? slot.mealLabel : slotItem?.dishName}
            </p>
            {mode === "slot" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {slot.items.map((item) => (
                  <span
                    key={`reuse-source-${item.id}`}
                    className="rounded-full border border-sand/70 bg-sand/35 px-3 py-1 text-[11px] font-medium text-cocoa"
                  >
                    {item.dishName}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-cocoa">
              {mode === "slot"
                ? t("weeklyMenu.reuse.slotDescription")
                : t("weeklyMenu.reuse.itemDescription")}
            </p>
            <p className="mt-2 text-xs font-medium leading-6 text-cocoa/78">
              {t("weeklyMenu.reuse.independentHint")}
            </p>
          </SurfaceCard>

          {!canReuse ? (
            <SurfaceCard className="border-sand/75 bg-sand/28">
              <p className="text-sm leading-6 text-cocoa">
                {mode === "slot"
                  ? t("weeklyMenu.reuse.archivedSlotNotice")
                  : t("weeklyMenu.reuse.archivedDishNotice")}
              </p>
            </SurfaceCard>
          ) : null}

          <div>
            <p className="text-sm font-semibold text-ink">
              {t("weeklyMenu.reuse.targetDay")}
            </p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {targetDays.map((targetDay) => (
                <DayOverviewButton
                  key={`reuse-day-${targetDay.day.isoDate}`}
                  day={targetDay.day}
                  isActive={targetDay.day.dayIndex === selectedTargetDay?.day.dayIndex}
                  onSelect={setSelectedDayIndex}
                />
              ))}
            </div>
          </div>

          {selectedTargetDay ? (
            <div>
              <p className="text-sm font-semibold text-ink">
                {t("weeklyMenu.reuse.targetMeal")}
              </p>
              <div className="mt-3 space-y-3">
                {selectedTargetDay.targets.map((target) => (
                  <button
                    key={`reuse-target-${target.dayIndex}-${target.mealType}`}
                    type="button"
                    onClick={() =>
                      onSelectTarget({
                        dayIndex: target.dayIndex,
                        mealType: target.mealType,
                      })
                    }
                    disabled={!canReuse || !target.isAvailable || isPending}
                    className={[
                      "w-full rounded-[1.4rem] border px-4 py-3.5 text-left shadow-sm transition",
                      target.isAvailable
                        ? "border-white/80 bg-white/92 hover:bg-white"
                        : "border-sand/80 bg-sand/45 text-cocoa/90",
                      isPending ? "opacity-70" : "",
                    ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-sm font-semibold text-ink">{target.mealLabel}</p>
                          <p className="break-words text-sm leading-6 text-cocoa">
                            {target.isAvailable ? target.summaryLabel : target.statusLabel}
                          </p>
                        </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
                          target.isAvailable
                            ? "bg-blush text-ink"
                            : "bg-white/85 text-cocoa shadow-sm",
                        ].join(" ")}
                      >
                        {target.isAvailable
                          ? t("weeklyMenu.reuse.pickTarget")
                          : target.statusLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {canReuse && noAvailableTargets ? (
            <SurfaceCard className={infoCardClassName}>
              <p className="text-sm font-semibold text-ink">
                {t("weeklyMenu.reuse.noTargetsTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-cocoa">
                {mode === "slot"
                  ? t("weeklyMenu.reuse.noSlotTargetsDescription")
                  : t("weeklyMenu.reuse.noItemTargetsDescription")}
              </p>
            </SurfaceCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WeeklyMenuScreen({
  menu,
  dishes,
  assignAction,
  clearAction,
  addDishAction,
  replaceItemAction,
  removeItemAction,
  reuseItemAction,
  reuseSlotAction,
  errorMessage,
  shoppingSummary,
}: {
  menu: WeeklyMenuView;
  dishes: DishSummary[];
  assignAction: (formData: FormData) => Promise<void>;
  clearAction: (formData: FormData) => Promise<void>;
  addDishAction: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>;
  replaceItemAction: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>;
  removeItemAction: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>;
  reuseItemAction: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>;
  reuseSlotAction: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>;
  errorMessage?: string;
  shoppingSummary: CurrentWeekShoppingListSummary | null;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [sheetState, setSheetState] = useState<{
    dayIndex: number;
    mealType: MealType;
    view: "overview" | "details" | "picker" | "reuse";
    slotItemId?: string;
    pickerMode?: "add" | "replace";
    reuseMode?: ReuseMode;
  } | null>(null);
  const [slotFeedback, setSlotFeedback] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(() =>
    getInitialActiveDayIndex(menu.days),
  );

  const activeDay =
    menu.days.find((day) => day.dayIndex === activeDayIndex) ?? menu.days[0];
  const selectedDay = menu.days.find((day) => day.dayIndex === sheetState?.dayIndex);
  const selectedSlot = selectedDay?.slots.find(
    (slot) => slot.mealType === sheetState?.mealType,
  );
  const selectedSlotItem = sheetState?.slotItemId
    ? selectedSlot?.items.find((item) => item.id === sheetState.slotItemId)
    : undefined;
  const mealsAssignedText = activeDay
    ? t("weeklyMenu.day.mealsAssigned", {
        filled: activeDay.filledMeals,
        total: activeDay.slots.length,
      })
    : "";

  useEffect(() => {
    if (!sheetState) {
      return;
    }

    if (!selectedDay || !selectedSlot) {
      setSheetState(null);
      return;
    }

    if (sheetState.view === "details" && !selectedSlotItem) {
      setSheetState({
        dayIndex: sheetState.dayIndex,
        mealType: sheetState.mealType,
        view: selectedSlot.items.length > 0 ? "overview" : "picker",
        pickerMode: selectedSlot.items.length > 0 ? undefined : "add",
      });
      return;
    }

    if (
      sheetState.view === "picker" &&
      sheetState.pickerMode === "replace" &&
      sheetState.slotItemId &&
      !selectedSlotItem
    ) {
      setSheetState({
        dayIndex: sheetState.dayIndex,
        mealType: sheetState.mealType,
        view: selectedSlot.items.length > 0 ? "overview" : "picker",
        pickerMode: selectedSlot.items.length > 0 ? undefined : "add",
      });
      return;
    }

    if (
      sheetState.view === "reuse" &&
      sheetState.reuseMode === "item" &&
      sheetState.slotItemId &&
      !selectedSlotItem
    ) {
      setSheetState({
        dayIndex: sheetState.dayIndex,
        mealType: sheetState.mealType,
        view: selectedSlot.items.length > 0 ? "overview" : "picker",
        pickerMode: selectedSlot.items.length > 0 ? undefined : "add",
      });
    }
  }, [selectedDay, selectedSlot, selectedSlotItem, sheetState]);

  function buildMutationFormData(fields: Record<string, string | number>) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, `${value}`);
    }

    return formData;
  }

  function getMutationErrorMessage(code: WeeklyMenuSlotMutationErrorCode) {
    if (code === "duplicate_dish_in_slot") {
      return t("weeklyMenu.slotFlow.duplicateNotice");
    }

    if (code === "slot_not_empty") {
      return t("weeklyMenu.reuse.targetRequiresEmpty");
    }

    if (code === "dish_not_available") {
      return t("weeklyMenu.slotFlow.dishNotAvailable");
    }

    return t("weeklyMenu.slotFlow.actionFailed");
  }

  function resetToOverview(day: WeeklyMenuDayView, slot: WeeklyMenuSlotView) {
    setSlotFeedback(null);
    setSheetState({
      dayIndex: day.dayIndex,
      mealType: slot.mealType,
      view: "overview",
    });
  }

  function runSlotMutation(
    action: (formData: FormData) => Promise<WeeklyMenuSlotMutationResult>,
    fields: Record<string, string | number>,
    onSuccess?: (result: Extract<WeeklyMenuSlotMutationResult, { status: "success" }>) => void,
  ) {
    setSlotFeedback(null);

    startTransition(async () => {
      const result = await action(buildMutationFormData(fields));

      if (result.status === "success") {
        onSuccess?.(result);
        return;
      }

      setSlotFeedback(getMutationErrorMessage(result.code));
    });
  }

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
        <SurfaceCard className={errorSurfaceClassName}>
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
          <SurfaceCard className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-ink">
                  {t("weeklyMenu.overview.title")}
                </p>
                <p className="text-sm leading-6 text-cocoa">
                  {t("weeklyMenu.overview.description")}
                </p>
              </div>
              <span className={countPillClassName}>
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
            <SurfaceCard className={stateSurfaceClassName}>
              <div className={stateSurfaceBodyClassName}>
                <div className={stateSurfaceBadgeClassName}>
                  {t("navigation.badges.weeklyMenu")}
                </div>
                <h2 className={stateSurfaceTitleClassName}>
                  {t("weeklyMenu.empty.title")}
                </h2>
                <p className={stateSurfaceDescriptionClassName}>
                  {t("weeklyMenu.empty.description")}
                </p>
                <Link
                  href="/dishes/new"
                  prefetch={false}
                  className="mt-5 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
                >
                  {t("weeklyMenu.empty.cta")}
                </Link>
              </div>
            </SurfaceCard>
          ) : null}

          {activeDay ? (
            <DayCard
              day={activeDay}
              onOpenSlot={(slot) => resetToOverview(activeDay, slot)}
              noMealsAssignedText={t("weeklyMenu.day.noMealsAssigned")}
              mealsAssignedText={mealsAssignedText}
              todayLabel={t("weeklyMenu.day.today")}
              chooseDishLabel={t("weeklyMenu.slot.chooseDish")}
              pickLabel={t("weeklyMenu.slot.pick")}
              archivedLabel={t("weeklyMenu.slot.archived")}
            />
          ) : null}

          <ProductsBridgeRow
            hasMealPlan={menu.hasMealPlan}
            shoppingSummary={shoppingSummary}
          />
        </>
      ) : null}

      {selectedDay && selectedSlot && sheetState ? (
        <SlotSheet
          onClose={() => {
            setSlotFeedback(null);
            setSheetState(null);
          }}
          closeAriaLabel={t("weeklyMenu.sheet.closeAriaLabel")}
        >
          {sheetState.view === "overview" ? (
            <SlotOverviewPanel
              day={selectedDay}
              slot={selectedSlot}
              onOpenDetails={(slotItemId) =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "details",
                  slotItemId,
                })
              }
              onAdd={() =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "picker",
                  pickerMode: "add",
                })
              }
              onReplace={(slotItemId) =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "picker",
                  pickerMode: "replace",
                  slotItemId,
                })
              }
              onReuseItem={(slotItemId) =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "reuse",
                  reuseMode: "item",
                  slotItemId,
                })
              }
              onReuseSlot={() =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "reuse",
                  reuseMode: "slot",
                })
              }
              onRemove={(slotItemId) => {
                const shouldRemove = window.confirm(
                  t("weeklyMenu.slotFlow.removeConfirm", {
                    mealLabel: selectedSlot.mealLabel.toLowerCase(),
                    dayLabel: selectedDay.label,
                    dateLabel: selectedDay.dateLabel,
                  }),
                );

                if (!shouldRemove) {
                  return;
                }

                runSlotMutation(
                  removeItemAction,
                  {
                    dayIndex: selectedDay.dayIndex,
                    mealType: selectedSlot.mealType,
                    slotItemId,
                  },
                  (result) => {
                    if (result.slotIsEmpty) {
                      setSlotFeedback(null);
                      setSheetState(null);
                      return;
                    }

                    resetToOverview(selectedDay, selectedSlot);
                  },
                );
              }}
              onClose={() => {
                setSlotFeedback(null);
                setSheetState(null);
              }}
              feedbackMessage={slotFeedback}
              isPending={isPending}
              locale={locale}
            />
          ) : null}

          {sheetState.view === "details" && selectedSlotItem ? (
            <SlotItemDetailsPanel
              day={selectedDay}
              slot={selectedSlot}
              slotItem={selectedSlotItem}
              onBack={() => resetToOverview(selectedDay, selectedSlot)}
              onReplace={() =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "picker",
                  pickerMode: "replace",
                  slotItemId: selectedSlotItem.id,
                })
              }
              onReuse={() =>
                setSheetState({
                  dayIndex: selectedDay.dayIndex,
                  mealType: selectedSlot.mealType,
                  view: "reuse",
                  reuseMode: "item",
                  slotItemId: selectedSlotItem.id,
                })
              }
              onRemove={() => {
                const shouldRemove = window.confirm(
                  t("weeklyMenu.slotFlow.removeConfirm", {
                    mealLabel: selectedSlot.mealLabel.toLowerCase(),
                    dayLabel: selectedDay.label,
                    dateLabel: selectedDay.dateLabel,
                  }),
                );

                if (!shouldRemove) {
                  return;
                }

                runSlotMutation(
                  removeItemAction,
                  {
                    dayIndex: selectedDay.dayIndex,
                    mealType: selectedSlot.mealType,
                    slotItemId: selectedSlotItem.id,
                  },
                  (result) => {
                    if (result.slotIsEmpty) {
                      setSlotFeedback(null);
                      setSheetState(null);
                      return;
                    }

                    resetToOverview(selectedDay, selectedSlot);
                  },
                );
              }}
              onClose={() => {
                setSlotFeedback(null);
                setSheetState(null);
              }}
              isPending={isPending}
              locale={locale}
            />
          ) : null}

          {sheetState.view === "reuse" && sheetState.reuseMode ? (
            <SlotReusePickerPanel
              menu={menu}
              day={selectedDay}
              slot={selectedSlot}
              slotItem={sheetState.reuseMode === "item" ? selectedSlotItem : undefined}
              mode={sheetState.reuseMode}
              onBack={() => resetToOverview(selectedDay, selectedSlot)}
              onClose={() => {
                setSlotFeedback(null);
                setSheetState(null);
              }}
              onSelectTarget={({ dayIndex, mealType }) => {
                if (sheetState.reuseMode === "item" && sheetState.slotItemId) {
                  runSlotMutation(
                    reuseItemAction,
                    {
                      sourceDayIndex: selectedDay.dayIndex,
                      sourceMealType: selectedSlot.mealType,
                      slotItemId: sheetState.slotItemId,
                      dayIndex,
                      mealType,
                    },
                    () => {
                      resetToOverview(selectedDay, selectedSlot);
                    },
                  );
                  return;
                }

                runSlotMutation(
                  reuseSlotAction,
                  {
                    sourceDayIndex: selectedDay.dayIndex,
                    sourceMealType: selectedSlot.mealType,
                    dayIndex,
                    mealType,
                  },
                  () => {
                    resetToOverview(selectedDay, selectedSlot);
                  },
                );
              }}
              feedbackMessage={slotFeedback}
              isPending={isPending}
            />
          ) : null}

          {sheetState.view === "picker" ? (
            <SlotDishPickerPanel
              day={selectedDay}
              slot={selectedSlot}
              dishes={dishes}
              replaceTargetItemId={
                sheetState.pickerMode === "replace" ? sheetState.slotItemId : undefined
              }
              onBack={() => resetToOverview(selectedDay, selectedSlot)}
              onClose={() => {
                setSlotFeedback(null);
                setSheetState(null);
              }}
              onSelectDish={(dishId) => {
                if (sheetState.pickerMode === "replace" && sheetState.slotItemId) {
                  runSlotMutation(
                    replaceItemAction,
                    {
                      dayIndex: selectedDay.dayIndex,
                      mealType: selectedSlot.mealType,
                      slotItemId: sheetState.slotItemId,
                      dishId,
                    },
                    () => {
                      resetToOverview(selectedDay, selectedSlot);
                    },
                  );
                  return;
                }

                runSlotMutation(
                  addDishAction,
                  {
                    dayIndex: selectedDay.dayIndex,
                    mealType: selectedSlot.mealType,
                    dishId,
                  },
                  () => {
                    resetToOverview(selectedDay, selectedSlot);
                  },
                );
              }}
              feedbackMessage={slotFeedback}
              isPending={isPending}
              locale={locale}
            />
          ) : null}
        </SlotSheet>
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

      <SurfaceCard className="bg-white/72 px-4 py-3">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-44" />
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
