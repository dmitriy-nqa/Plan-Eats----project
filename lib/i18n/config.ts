export const appLocales = ["ru", "en"] as const;

export type AppLocale = (typeof appLocales)[number];
export type TranslationParams = Record<string, string | number>;

export const defaultLocale: AppLocale = "ru";
export const localeCookieName = "plan-eat-locale";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;
export const localeCookieAttributes = `path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
export const intlLocaleByAppLocale: Record<AppLocale, string> = {
  ru: "ru-RU",
  en: "en-US",
};

export type TranslationMessages = {
  common: {
    actions: {
      save: string;
      cancel: string;
      back: string;
      edit: string;
      archive: string;
      restore: string;
      delete: string;
      close: string;
      search: string;
      clear: string;
    };
    locale: {
      ru: string;
      en: string;
    };
  };
  domain: {
    mealType: {
      breakfast: string;
      lunch: string;
      dinner: string;
    };
    dishCategory: {
      breakfast: string;
      soup: string;
      salad: string;
      mainCourse: string;
      bakeryAndDesserts: string;
    };
  };
  settings: {
    header: {
      eyebrow: string;
      title: string;
      description: string;
    };
    family: {
      label: string;
      name: string;
      description: string;
    };
    planningMode: {
      label: string;
      description: string;
    };
    secondUser: {
      label: string;
      description: string;
    };
    language: {
      label: string;
    };
  };
  weeklyMenu: {
    header: {
      eyebrow: string;
      title: string;
      description: string;
    };
    hero: {
      title: string;
      withMealPlan: string;
      empty: string;
    };
    overview: {
      title: string;
      description: string;
    };
    day: {
      noMealsAssigned: string;
      mealsAssigned: string;
      today: string;
    };
    slot: {
      chooseDish: string;
      pick: string;
      archived: string;
    };
    picker: {
      eyebrow: string;
      replaceEyebrow: string;
      backToDetails: string;
      searchLabel: string;
      searchPlaceholder: string;
      summaryFallback: string;
      empty: {
        title: string;
        description: string;
        cta: string;
      };
      noResults: {
        title: string;
        description: string;
      };
    };
    details: {
      title: string;
      fallbackTitle: string;
      archived: string;
      cookNote: string;
      ingredients: string;
      noIngredients: string;
      howToCook: string;
      noCookingSteps: string;
      notes: string;
      unavailable: {
        title: string;
        description: string;
      };
      replace: string;
      confirmClear: string;
    };
    errors: {
      title: string;
      retry: string;
      configurationHelp: string;
      unknown: string;
    };
    empty: {
      title: string;
      description: string;
      cta: string;
    };
    status: {
      unavailableDish: string;
    };
    sheet: {
      closeAriaLabel: string;
    };
  };
};

export type TranslationKey =
  | "common.actions.save"
  | "common.actions.cancel"
  | "common.actions.back"
  | "common.actions.edit"
  | "common.actions.archive"
  | "common.actions.restore"
  | "common.actions.delete"
  | "common.actions.close"
  | "common.actions.search"
  | "common.actions.clear"
  | "common.locale.ru"
  | "common.locale.en"
  | "domain.mealType.breakfast"
  | "domain.mealType.lunch"
  | "domain.mealType.dinner"
  | "domain.dishCategory.breakfast"
  | "domain.dishCategory.soup"
  | "domain.dishCategory.salad"
  | "domain.dishCategory.mainCourse"
  | "domain.dishCategory.bakeryAndDesserts"
  | "settings.header.eyebrow"
  | "settings.header.title"
  | "settings.header.description"
  | "settings.family.label"
  | "settings.family.name"
  | "settings.family.description"
  | "settings.planningMode.label"
  | "settings.planningMode.description"
  | "settings.secondUser.label"
  | "settings.secondUser.description"
  | "settings.language.label"
  | "weeklyMenu.header.eyebrow"
  | "weeklyMenu.header.title"
  | "weeklyMenu.header.description"
  | "weeklyMenu.hero.title"
  | "weeklyMenu.hero.withMealPlan"
  | "weeklyMenu.hero.empty"
  | "weeklyMenu.overview.title"
  | "weeklyMenu.overview.description"
  | "weeklyMenu.day.noMealsAssigned"
  | "weeklyMenu.day.mealsAssigned"
  | "weeklyMenu.day.today"
  | "weeklyMenu.slot.chooseDish"
  | "weeklyMenu.slot.pick"
  | "weeklyMenu.slot.archived"
  | "weeklyMenu.picker.eyebrow"
  | "weeklyMenu.picker.replaceEyebrow"
  | "weeklyMenu.picker.backToDetails"
  | "weeklyMenu.picker.searchLabel"
  | "weeklyMenu.picker.searchPlaceholder"
  | "weeklyMenu.picker.summaryFallback"
  | "weeklyMenu.picker.empty.title"
  | "weeklyMenu.picker.empty.description"
  | "weeklyMenu.picker.empty.cta"
  | "weeklyMenu.picker.noResults.title"
  | "weeklyMenu.picker.noResults.description"
  | "weeklyMenu.details.title"
  | "weeklyMenu.details.fallbackTitle"
  | "weeklyMenu.details.archived"
  | "weeklyMenu.details.cookNote"
  | "weeklyMenu.details.ingredients"
  | "weeklyMenu.details.noIngredients"
  | "weeklyMenu.details.howToCook"
  | "weeklyMenu.details.noCookingSteps"
  | "weeklyMenu.details.notes"
  | "weeklyMenu.details.unavailable.title"
  | "weeklyMenu.details.unavailable.description"
  | "weeklyMenu.details.replace"
  | "weeklyMenu.details.confirmClear"
  | "weeklyMenu.errors.title"
  | "weeklyMenu.errors.retry"
  | "weeklyMenu.errors.configurationHelp"
  | "weeklyMenu.errors.unknown"
  | "weeklyMenu.empty.title"
  | "weeklyMenu.empty.description"
  | "weeklyMenu.empty.cta"
  | "weeklyMenu.status.unavailableDish"
  | "weeklyMenu.sheet.closeAriaLabel";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}
