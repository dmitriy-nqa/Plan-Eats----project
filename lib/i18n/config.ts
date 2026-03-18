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
  navigation: {
    bottom: {
      weeklyMenu: string;
      dishLibrary: string;
      products: string;
      settings: string;
    };
    badges: {
      weeklyMenu: string;
      dishLibrary: string;
      products: string;
      settings: string;
    };
  };
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
    badges: {
      search: string;
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
  dishes: {
    navigation: {
      backToLibrary: string;
    };
    setup: {
      title: string;
      newDescription: string;
      detailsDescription: string;
      editDescription: string;
      hint: string;
    };
    summary: {
      fallback: string;
    };
    mode: {
      active: string;
      archived: string;
    };
    actions: {
      addDish: string;
    };
    search: {
      label: string;
      placeholder: string;
    };
    library: {
      header: {
        eyebrow: string;
        title: string;
        description: string;
      };
      count: string;
      activeDescription: string;
      archivedDescription: string;
      errorTitle: string;
      unknownError: string;
      empty: {
        search: {
          title: string;
          description: string;
        };
        active: {
          title: string;
          description: string;
        };
        archived: {
          title: string;
          description: string;
        };
      };
    };
    details: {
      header: {
        eyebrow: string;
        activeDescription: string;
        archivedDescription: string;
      };
      archivedBadge: string;
      archivedNotice: {
        title: string;
        description: string;
      };
      sections: {
        ingredients: string;
        cookingSteps: string;
        notes: string;
      };
      empty: {
        ingredients: string;
        cookingSteps: string;
        notes: string;
      };
    };
    form: {
      header: {
        eyebrow: string;
        createTitle: string;
        editTitle: string;
        createDescription: string;
        editDescription: string;
      };
      badges: {
        newDish: string;
        editMode: string;
      };
      fields: {
        dishName: string;
        category: string;
        comment: string;
        recipeText: string;
        ingredient: string;
        quantity: string;
        unit: string;
      };
      placeholders: {
        dishName: string;
        comment: string;
        recipeText: string;
        ingredient: string;
      };
      ingredients: {
        title: string;
        description: string;
        rowsCount: string;
        addRow: string;
        removeRow: string;
      };
      actions: {
        title: string;
        saveDish: string;
        saveChanges: string;
        saving: string;
      };
    };
  };
};

export type TranslationKey =
  | "navigation.bottom.weeklyMenu"
  | "navigation.bottom.dishLibrary"
  | "navigation.bottom.products"
  | "navigation.bottom.settings"
  | "navigation.badges.weeklyMenu"
  | "navigation.badges.dishLibrary"
  | "navigation.badges.products"
  | "navigation.badges.settings"
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
  | "common.badges.search"
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
  | "weeklyMenu.sheet.closeAriaLabel"
  | "dishes.navigation.backToLibrary"
  | "dishes.setup.title"
  | "dishes.setup.newDescription"
  | "dishes.setup.detailsDescription"
  | "dishes.setup.editDescription"
  | "dishes.setup.hint"
  | "dishes.summary.fallback"
  | "dishes.mode.active"
  | "dishes.mode.archived"
  | "dishes.actions.addDish"
  | "dishes.search.label"
  | "dishes.search.placeholder"
  | "dishes.library.header.eyebrow"
  | "dishes.library.header.title"
  | "dishes.library.header.description"
  | "dishes.library.count"
  | "dishes.library.activeDescription"
  | "dishes.library.archivedDescription"
  | "dishes.library.errorTitle"
  | "dishes.library.unknownError"
  | "dishes.library.empty.search.title"
  | "dishes.library.empty.search.description"
  | "dishes.library.empty.active.title"
  | "dishes.library.empty.active.description"
  | "dishes.library.empty.archived.title"
  | "dishes.library.empty.archived.description"
  | "dishes.details.header.eyebrow"
  | "dishes.details.header.activeDescription"
  | "dishes.details.header.archivedDescription"
  | "dishes.details.archivedBadge"
  | "dishes.details.archivedNotice.title"
  | "dishes.details.archivedNotice.description"
  | "dishes.details.sections.ingredients"
  | "dishes.details.sections.cookingSteps"
  | "dishes.details.sections.notes"
  | "dishes.details.empty.ingredients"
  | "dishes.details.empty.cookingSteps"
  | "dishes.details.empty.notes"
  | "dishes.form.header.eyebrow"
  | "dishes.form.header.createTitle"
  | "dishes.form.header.editTitle"
  | "dishes.form.header.createDescription"
  | "dishes.form.header.editDescription"
  | "dishes.form.badges.newDish"
  | "dishes.form.badges.editMode"
  | "dishes.form.fields.dishName"
  | "dishes.form.fields.category"
  | "dishes.form.fields.comment"
  | "dishes.form.fields.recipeText"
  | "dishes.form.fields.ingredient"
  | "dishes.form.fields.quantity"
  | "dishes.form.fields.unit"
  | "dishes.form.placeholders.dishName"
  | "dishes.form.placeholders.comment"
  | "dishes.form.placeholders.recipeText"
  | "dishes.form.placeholders.ingredient"
  | "dishes.form.ingredients.title"
  | "dishes.form.ingredients.description"
  | "dishes.form.ingredients.rowsCount"
  | "dishes.form.ingredients.addRow"
  | "dishes.form.ingredients.removeRow"
  | "dishes.form.actions.title"
  | "dishes.form.actions.saveDish"
  | "dishes.form.actions.saveChanges"
  | "dishes.form.actions.saving";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}
