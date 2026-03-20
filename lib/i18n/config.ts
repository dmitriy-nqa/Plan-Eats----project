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
    slotFlow?: {
      eyebrow: string;
      emptyTitle: string;
      emptyDescription: string;
      addFirst: string;
      addMore: string;
      remove: string;
      removeConfirm: string;
      backToSlot: string;
      alreadyInSlot: string;
      duplicateNotice: string;
      actionFailed: string;
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
    productsBridge: {
      title: string;
      emptyPlan: string;
      noItems: string;
      ready: string;
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
      validation: {
        fixErrors: string;
        nameRequired: string;
        ingredientIncomplete: string;
        ingredientQuantityInvalid: string;
        saveFailed: string;
      };
      productLink: {
        linkedTo: string;
        archived: string;
        unlink: string;
        relink: string;
        useProduct: string;
        suggestionsTitle: string;
        matchCanonical: string;
        matchAlias: string;
        matchToken: string;
        matchPartial: string;
        archivedMatch: string;
        openArchived: string;
      };
    };
  };
  products: {
    setup: {
      title: string;
      listDescription: string;
      newDescription: string;
      editDescription: string;
      hint: string;
    };
    navigation: {
      backToLibrary: string;
    };
    mode: {
      active: string;
      archived: string;
    };
    actions: {
      addProduct: string;
    };
    search: {
      label: string;
      placeholder: string;
    };
    header: {
      eyebrow: string;
      title: string;
      description: string;
    };
    list: {
      count: string;
      aliasCount: string;
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
    form: {
      header: {
        eyebrow: string;
        createTitle: string;
        editTitle: string;
        createDescription: string;
        editDescription: string;
      };
      badges: {
        newProduct: string;
        editMode: string;
        archived: string;
      };
      fields: {
        displayName: string;
      };
      placeholders: {
        displayName: string;
        alias: string;
      };
      aliases: {
        title: string;
        description: string;
        rowsCount: string;
        addRow: string;
        removeRow: string;
      };
      actions: {
        title: string;
        saveProduct: string;
        saveChanges: string;
        saving: string;
      };
      duplicate: {
        canonical: string;
        alias: string;
        token: string;
        archived: string;
        openExisting: string;
        openArchived: string;
      };
      validation: {
        fixErrors: string;
        displayNameRequired: string;
        aliasDuplicate: string;
        aliasMatchesDisplayName: string;
        saveFailed: string;
      };
    };
    details: {
      manageTitle: string;
      activeDescription: string;
      archivedDescription: string;
    };
    merge: {
      title: string;
      description: string;
      fields: {
        targetProduct: string;
      };
      placeholders: {
        targetProduct: string;
      };
      actions: {
        merge: string;
        merging: string;
      };
      validation: {
        targetRequired: string;
        failed: string;
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
  | "weeklyMenu.slotFlow.eyebrow"
  | "weeklyMenu.slotFlow.emptyTitle"
  | "weeklyMenu.slotFlow.emptyDescription"
  | "weeklyMenu.slotFlow.addFirst"
  | "weeklyMenu.slotFlow.addMore"
  | "weeklyMenu.slotFlow.remove"
  | "weeklyMenu.slotFlow.removeConfirm"
  | "weeklyMenu.slotFlow.backToSlot"
  | "weeklyMenu.slotFlow.alreadyInSlot"
  | "weeklyMenu.slotFlow.duplicateNotice"
  | "weeklyMenu.slotFlow.actionFailed"
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
  | "weeklyMenu.productsBridge.title"
  | "weeklyMenu.productsBridge.emptyPlan"
  | "weeklyMenu.productsBridge.noItems"
  | "weeklyMenu.productsBridge.ready"
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
  | "dishes.form.actions.saving"
  | "dishes.form.validation.fixErrors"
  | "dishes.form.validation.nameRequired"
  | "dishes.form.validation.ingredientIncomplete"
  | "dishes.form.validation.ingredientQuantityInvalid"
  | "dishes.form.validation.saveFailed"
  | "dishes.form.productLink.linkedTo"
  | "dishes.form.productLink.archived"
  | "dishes.form.productLink.unlink"
  | "dishes.form.productLink.relink"
  | "dishes.form.productLink.useProduct"
  | "dishes.form.productLink.suggestionsTitle"
  | "dishes.form.productLink.matchCanonical"
  | "dishes.form.productLink.matchAlias"
  | "dishes.form.productLink.matchToken"
  | "dishes.form.productLink.matchPartial"
  | "dishes.form.productLink.archivedMatch"
  | "dishes.form.productLink.openArchived"
  | "products.setup.title"
  | "products.setup.listDescription"
  | "products.setup.newDescription"
  | "products.setup.editDescription"
  | "products.setup.hint"
  | "products.navigation.backToLibrary"
  | "products.mode.active"
  | "products.mode.archived"
  | "products.actions.addProduct"
  | "products.search.label"
  | "products.search.placeholder"
  | "products.header.eyebrow"
  | "products.header.title"
  | "products.header.description"
  | "products.list.count"
  | "products.list.aliasCount"
  | "products.list.activeDescription"
  | "products.list.archivedDescription"
  | "products.list.errorTitle"
  | "products.list.unknownError"
  | "products.list.empty.search.title"
  | "products.list.empty.search.description"
  | "products.list.empty.active.title"
  | "products.list.empty.active.description"
  | "products.list.empty.archived.title"
  | "products.list.empty.archived.description"
  | "products.form.header.eyebrow"
  | "products.form.header.createTitle"
  | "products.form.header.editTitle"
  | "products.form.header.createDescription"
  | "products.form.header.editDescription"
  | "products.form.badges.newProduct"
  | "products.form.badges.editMode"
  | "products.form.badges.archived"
  | "products.form.fields.displayName"
  | "products.form.placeholders.displayName"
  | "products.form.placeholders.alias"
  | "products.form.aliases.title"
  | "products.form.aliases.description"
  | "products.form.aliases.rowsCount"
  | "products.form.aliases.addRow"
  | "products.form.aliases.removeRow"
  | "products.form.actions.title"
  | "products.form.actions.saveProduct"
  | "products.form.actions.saveChanges"
  | "products.form.actions.saving"
  | "products.form.duplicate.canonical"
  | "products.form.duplicate.alias"
  | "products.form.duplicate.token"
  | "products.form.duplicate.archived"
  | "products.form.duplicate.openExisting"
  | "products.form.duplicate.openArchived"
  | "products.form.validation.fixErrors"
  | "products.form.validation.displayNameRequired"
  | "products.form.validation.aliasDuplicate"
  | "products.form.validation.aliasMatchesDisplayName"
  | "products.form.validation.saveFailed"
  | "products.details.manageTitle"
  | "products.details.activeDescription"
  | "products.details.archivedDescription"
  | "products.merge.title"
  | "products.merge.description"
  | "products.merge.fields.targetProduct"
  | "products.merge.placeholders.targetProduct"
  | "products.merge.actions.merge"
  | "products.merge.actions.merging"
  | "products.merge.validation.targetRequired"
  | "products.merge.validation.failed";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}
