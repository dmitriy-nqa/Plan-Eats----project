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

export type WeeklyMenuDishOption = {
  id: string;
  name: string;
  category: DishCategory;
};

export type WeeklyMenuSlotRecord = {
  dayIndex: number;
  mealType: MealType;
  dishId: string;
  dishName: string;
  isArchivedDish: boolean;
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

export type WeeklyMenuSlotView = {
  mealType: MealType;
  mealLabel: string;
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
    slots.map((slot) => [`${slot.dayIndex}:${slot.mealType}`, slot] as const),
  );

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = addDays(weekRange.start, dayIndex);
    const isoDate = formatDateKey(date);
    const daySlots = mealTypeValues.map((mealType) => {
      const slot = slotsByKey.get(`${dayIndex}:${mealType}`);

      return {
        mealType,
        mealLabel: getMealTypeLabel(mealType, locale),
        dishId: slot?.dishId,
        dishName: slot?.dishName,
        isArchivedDish: slot?.isArchivedDish ?? false,
        dishDetails: slot?.dishDetails,
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
      filledMeals: daySlots.filter((slot) => Boolean(slot.dishId)).length,
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
