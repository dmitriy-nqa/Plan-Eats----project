import type { DishCategory } from "@/lib/dishes";
import type { IngredientUnit } from "@/lib/dish-form";
import {
  intlLocaleByAppLocale,
  type AppLocale,
  type TranslationKey,
} from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/translate";

export const mealTypeValues = ["breakfast", "lunch", "dinner"] as const;

export type MealType = (typeof mealTypeValues)[number];

export type WeeklyMenuSlotCoordinate = {
  dayIndex: number;
  mealType: MealType;
};

export const weeklyMenuMutationErrorCodes = [
  "duplicate_dish_in_slot",
  "slot_item_not_found",
  "slot_not_found",
  "slot_not_empty",
  "dish_not_available",
] as const;

export type WeeklyMenuMutationErrorCode =
  (typeof weeklyMenuMutationErrorCodes)[number];

export class WeeklyMenuMutationError extends Error {
  code: WeeklyMenuMutationErrorCode;

  constructor(code: WeeklyMenuMutationErrorCode) {
    super(code);
    this.name = "WeeklyMenuMutationError";
    this.code = code;
  }
}

export type WeeklyMenuDishOption = {
  id: string;
  name: string;
  category: DishCategory;
};

export type WeeklyMenuSlotItemRecord = {
  id: string;
  slotId?: string;
  dishId: string;
  sortOrder: number;
  isArchivedDish: boolean;
  dishName: string;
  dishDetails?: WeeklyMenuSlotDishDetails;
};

export type WeeklyMenuSlotDishIngredient = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
};

export type WeeklyMenuSlotDishDetails = {
  id: string;
  name: string;
  category: DishCategory;
  comment?: string;
  recipeText?: string;
  ingredients: WeeklyMenuSlotDishIngredient[];
  isArchived: boolean;
};

export type WeeklyMenuSlotRecord = WeeklyMenuSlotCoordinate & {
  id?: string;
  items: WeeklyMenuSlotItemRecord[];
};

export type WeeklyMenuSlotItemView = {
  id: string;
  dishId: string;
  order: number;
  isArchivedDish: boolean;
  dishName: string;
  dishDetails?: WeeklyMenuSlotDishDetails;
};

export type WeeklyMenuSlotView = {
  id?: string;
  mealType: MealType;
  mealLabel: string;
  items: WeeklyMenuSlotItemView[];
  hasArchivedItems: boolean;
  dishId?: string;
  dishName?: string;
  isArchivedDish: boolean;
  dishDetails?: WeeklyMenuSlotDishDetails;
};

export type WeeklyMenuDayView = {
  dayIndex: number;
  shortLabel: string;
  label: string;
  dateLabel: string;
  dateNumber: string;
  isoDate: string;
  isToday: boolean;
  filledMeals: number;
  slots: WeeklyMenuSlotView[];
};

export type WeeklyMenuView = {
  weekLabel: string;
  filledSlots: number;
  totalSlots: number;
  hasMealPlan: boolean;
  mealPlanId?: string;
  days: WeeklyMenuDayView[];
};

export type WeekRange = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
};

const mealTypeTranslationKeys: Record<MealType, TranslationKey> = {
  breakfast: "domain.mealType.breakfast",
  lunch: "domain.mealType.lunch",
  dinner: "domain.mealType.dinner",
};

function cloneLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = cloneLocalDate(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFormatters(locale: AppLocale) {
  const intlLocale = intlLocaleByAppLocale[locale];

  return {
    weekdayShort: new Intl.DateTimeFormat(intlLocale, {
      weekday: "short",
    }),
    weekdayLong: new Intl.DateTimeFormat(intlLocale, {
      weekday: "long",
    }),
    day: new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
    }),
    dayMonth: new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "short",
    }),
    month: new Intl.DateTimeFormat(intlLocale, {
      month: "short",
    }),
  };
}

export function getMealTypeLabel(
  mealType: MealType,
  locale: AppLocale = "en",
) {
  return getTranslation(locale, mealTypeTranslationKeys[mealType]);
}

export function getWeeklyMenuSlotCoordinateKey({
  dayIndex,
  mealType,
}: WeeklyMenuSlotCoordinate) {
  return `${dayIndex}:${mealType}`;
}

export function buildWeeklyMenuCompatibilitySlotItemId({
  slotId,
  dayIndex,
  mealType,
  dishId,
  sortOrder,
}: WeeklyMenuSlotCoordinate & {
  slotId?: string;
  dishId: string;
  sortOrder: number;
}) {
  if (slotId) {
    return `slot:${slotId}:item:${sortOrder}`;
  }

  return [
    "compat-slot-item",
    `day:${dayIndex}`,
    `meal:${mealType}`,
    `dish:${dishId}`,
    `order:${sortOrder}`,
  ].join("|");
}

export function buildWeeklyMenuSlotItemLineageKey(args: {
  slotItemId?: string;
  slotId?: string;
  dayIndex: number;
  mealType: MealType;
  dishId: string;
  sortOrder: number;
}) {
  if (args.slotItemId) {
    return args.slotItemId;
  }

  return buildWeeklyMenuCompatibilitySlotItemId(args);
}

function sortWeeklyMenuSlotItems(items: WeeklyMenuSlotItemRecord[]) {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });
}

export function hasWeeklyMenuSlotDuplicateDishIds(
  items: Pick<WeeklyMenuSlotItemRecord, "dishId">[],
) {
  const seenDishIds = new Set<string>();

  for (const item of items) {
    if (seenDishIds.has(item.dishId)) {
      return true;
    }

    seenDishIds.add(item.dishId);
  }

  return false;
}

export function getWeeklyMenuSlotPrimaryItem<
  TSlot extends {
    items: readonly WeeklyMenuSlotItemRecord[] | readonly WeeklyMenuSlotItemView[];
  },
>(slot: TSlot) {
  return slot.items[0];
}

export function buildWeeklyMenuSlotRecord(args: {
  slotId?: string;
  dayIndex: number;
  mealType: MealType;
  items: WeeklyMenuSlotItemRecord[];
}) {
  return {
    id: args.slotId,
    dayIndex: args.dayIndex,
    mealType: args.mealType,
    items: sortWeeklyMenuSlotItems(args.items),
  } satisfies WeeklyMenuSlotRecord;
}

export function buildWeeklyMenuCompatibilitySlotRecordFromSingleDish(args: {
  slotId?: string;
  dayIndex: number;
  mealType: MealType;
  dishId: string;
  dishName: string;
  isArchivedDish: boolean;
  dishDetails?: WeeklyMenuSlotDishDetails;
}) {
  const itemId = buildWeeklyMenuCompatibilitySlotItemId({
    slotId: args.slotId,
    dayIndex: args.dayIndex,
    mealType: args.mealType,
    dishId: args.dishId,
    sortOrder: 0,
  });

  return {
    ...buildWeeklyMenuSlotRecord({
      slotId: args.slotId,
      dayIndex: args.dayIndex,
      mealType: args.mealType,
      items: [
        {
          id: itemId,
          slotId: args.slotId,
          dishId: args.dishId,
          sortOrder: 0,
          dishName: args.dishName,
          isArchivedDish: args.isArchivedDish,
          dishDetails: args.dishDetails,
        },
      ],
    }),
  } satisfies WeeklyMenuSlotRecord;
}

export function isMealType(value: string): value is MealType {
  return mealTypeValues.includes(value as MealType);
}

export function getCurrentWeekRange(referenceDate = new Date()): WeekRange {
  const today = cloneLocalDate(referenceDate);
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = addDays(today, -daysFromMonday);
  const end = addDays(start, 6);

  return {
    start,
    end,
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
  };
}

function formatWeekLabel(start: Date, end: Date, locale: AppLocale) {
  const formatters = getDateFormatters(locale);
  const sameMonth = start.getMonth() === end.getMonth();
  const startDay = formatters.day.format(start);
  const endDay = formatters.day.format(end);

  if (sameMonth) {
    return `${startDay}-${endDay} ${formatters.month.format(end)}`;
  }

  return `${formatters.dayMonth.format(start)} - ${formatters.dayMonth.format(end)}`;
}

export function buildWeeklyMenuView({
  weekRange,
  slots,
  mealPlanId,
  locale = "en",
}: {
  weekRange: WeekRange;
  slots: WeeklyMenuSlotRecord[];
  mealPlanId?: string;
  locale?: AppLocale;
}): WeeklyMenuView {
  const formatters = getDateFormatters(locale);
  const todayKey = formatDateKey(new Date());
  const slotsByKey = new Map(
    slots.map((slot) => [
      getWeeklyMenuSlotCoordinateKey(slot),
      {
        ...slot,
        items: sortWeeklyMenuSlotItems(slot.items),
      },
    ]),
  );

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = addDays(weekRange.start, dayIndex);
    const isoDate = formatDateKey(date);
    const daySlots = mealTypeValues.map((mealType) => {
      const slot = slotsByKey.get(
        getWeeklyMenuSlotCoordinateKey({
          dayIndex,
          mealType,
        }),
      );
      const items =
        slot?.items.map((item) => ({
          id: item.id,
          dishId: item.dishId,
          order: item.sortOrder,
          dishName: item.dishName,
          isArchivedDish: item.isArchivedDish,
          dishDetails: item.dishDetails,
        })) ?? [];
      const primaryItem = getWeeklyMenuSlotPrimaryItem({
        items,
      });

      return {
        id: slot?.id,
        mealType,
        mealLabel: getMealTypeLabel(mealType, locale),
        items,
        hasArchivedItems: items.some((item) => item.isArchivedDish),
        dishId: primaryItem?.dishId,
        dishName: primaryItem?.dishName,
        isArchivedDish: primaryItem?.isArchivedDish ?? false,
        dishDetails: primaryItem?.dishDetails,
      } satisfies WeeklyMenuSlotView;
    });

    return {
      dayIndex,
      shortLabel: formatters.weekdayShort.format(date),
      label: formatters.weekdayLong.format(date),
      dateLabel: formatters.dayMonth.format(date),
      dateNumber: formatters.day.format(date),
      isoDate,
      isToday: isoDate === todayKey,
      filledMeals: daySlots.filter((slot) => slot.items.length > 0).length,
      slots: daySlots,
    } satisfies WeeklyMenuDayView;
  });

  const filledSlots = days.reduce((total, day) => total + day.filledMeals, 0);

  return {
    weekLabel: formatWeekLabel(weekRange.start, weekRange.end, locale),
    filledSlots,
    totalSlots: days.length * mealTypeValues.length,
    hasMealPlan: Boolean(mealPlanId),
    mealPlanId,
    days,
  };
}

export function buildEmptyWeeklyMenuView(
  weekRange = getCurrentWeekRange(),
  locale: AppLocale = "en",
) {
  return buildWeeklyMenuView({
    weekRange,
    slots: [],
    locale,
  });
}

export function isWeeklyMenuMutationError(
  error: unknown,
): error is WeeklyMenuMutationError {
  return error instanceof WeeklyMenuMutationError;
}
