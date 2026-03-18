import type { TranslationMessages } from "@/lib/i18n/config";

export const enMessages: TranslationMessages = {
  navigation: {
    bottom: {
      weeklyMenu: "Weekly Menu",
      dishLibrary: "Dish Library",
      products: "Products",
      settings: "Settings",
    },
    badges: {
      weeklyMenu: "WM",
      dishLibrary: "DL",
      products: "PR",
      settings: "ST",
    },
  },
  common: {
    actions: {
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      edit: "Edit",
      archive: "Archive",
      restore: "Restore",
      delete: "Delete",
      close: "Close",
      search: "Search",
      clear: "Clear",
    },
    badges: {
      search: "S",
    },
    locale: {
      ru: "Русский",
      en: "English",
    },
  },
  domain: {
    mealType: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
    },
    dishCategory: {
      breakfast: "Breakfast",
      soup: "Soup",
      salad: "Salad",
      mainCourse: "Main course",
      bakeryAndDesserts: "Bakery and desserts",
    },
  },
  settings: {
    header: {
      eyebrow: "Shared Space",
      title: "Settings",
      description:
        "A minimal home for family and planning preferences. It stays intentionally light in the MVP skeleton.",
    },
    family: {
      label: "Family",
      name: "Plan&Eat Home",
      description: "Shared setup for two family users.",
    },
    planningMode: {
      label: "Planning mode",
      description: "Fixed to a 7-day weekly plan in MVP.",
    },
    secondUser: {
      label: "Second user",
      description: "Placeholder section for shared-family setup details.",
    },
    language: {
      label: "Language",
    },
  },
  weeklyMenu: {
    header: {
      eyebrow: "Main Screen",
      title: "Weekly Menu",
      description:
        "Tap an empty slot to pick a dish. Tap a filled slot to open the dish details before cooking, then replace or clear it if needed.",
    },
    hero: {
      title: "Current family week",
      withMealPlan: "The meal plan already exists for this week.",
      empty: "This week is still empty. The first slot assignment will create the meal plan.",
    },
    overview: {
      title: "Week overview",
      description: "Tap a day to switch the active plan below.",
    },
    day: {
      noMealsAssigned: "No dishes selected yet.",
      mealsAssigned: "{filled} of {total} meals assigned.",
      today: "Today",
    },
    slot: {
      chooseDish: "Choose a dish",
      pick: "Pick",
      archived: "Archived",
    },
    picker: {
      eyebrow: "Dish Picker",
      replaceEyebrow: "Replace Dish",
      backToDetails: "Back to details",
      searchLabel: "Search dishes",
      searchPlaceholder: "Search dishes",
      summaryFallback: "No short summary yet.",
      empty: {
        title: "No dishes to choose from yet",
        description: "Add the first family dish, then come back and assign it to this week.",
        cta: "Add dish",
      },
      noResults: {
        title: "No matching dishes",
        description: "Try a different search word or clear the search field.",
      },
    },
    details: {
      title: "Dish Details",
      fallbackTitle: "Dish details",
      archived: "Archived dish",
      cookNote: "Cook note",
      ingredients: "Ingredients",
      noIngredients: "No ingredients were added for this dish yet.",
      howToCook: "How to cook",
      noCookingSteps: "No cooking steps were added for this dish yet.",
      notes: "Notes",
      unavailable: {
        title: "Dish details are unavailable",
        description:
          "This slot still has a linked dish, but the detail payload could not be loaded. You can replace it or clear the slot.",
      },
      replace: "Replace",
      confirmClear: "Clear {mealLabel} on {dayLabel}, {dateLabel}?",
    },
    errors: {
      title: "Could not load weekly menu",
      retry: "Retry",
      configurationHelp:
        "Fill in .env.local and restart the server to use the shared weekly menu.",
      unknown: "Unknown error",
    },
    empty: {
      title: "The weekly menu is ready for real data",
      description:
        "Add at least one non-archived dish, then come back here and assign it to a slot.",
      cta: "Add first dish",
    },
    status: {
      unavailableDish: "Unavailable dish",
    },
    sheet: {
      closeAriaLabel: "Close slot sheet",
    },
  },
  dishes: {
    navigation: {
      backToLibrary: "Back to Dish Library",
    },
    setup: {
      title: "Supabase is not configured",
      newDescription:
        "The Add Dish form cannot save yet because local Supabase environment variables are missing.",
      detailsDescription:
        "Dish details cannot load until local Supabase variables are configured.",
      editDescription:
        "The Edit Dish form cannot load or save data until local Supabase variables are configured.",
      hint:
        "Fill in .env.local from .env.example and restart npm.cmd run dev.",
    },
    summary: {
      fallback: "No short summary yet.",
    },
    mode: {
      active: "Active",
      archived: "Archived",
    },
    actions: {
      addDish: "Add dish",
    },
    search: {
      label: "Search dishes",
      placeholder: "Search dishes",
    },
    library: {
      header: {
        eyebrow: "Family Recipes",
        title: "Dish Library",
        description:
          "Browse the family recipe library by category, open a dish to read it in full, and keep active and archived dishes easy to understand.",
      },
      count: "{count} dishes",
      activeDescription: "Active dishes are ready for planning and cooking.",
      archivedDescription:
        "Archived dishes stay available for reading, editing, and restoring when you need them again.",
      errorTitle: "Could not load Dish Library",
      unknownError: "Unknown error",
      empty: {
        search: {
          title: "No dishes match this search",
          description:
            "Try a different word or clear the search field to browse the library again.",
        },
        active: {
          title: "Your Dish Library is still empty",
          description:
            "Start with a few family dishes so weekly planning becomes faster and the library feels useful right away.",
        },
        archived: {
          title: "Archived dishes will appear here",
          description:
            "When you archive a dish, it leaves the active library and stays here until you decide to restore it.",
        },
      },
    },
    details: {
      header: {
        eyebrow: "Dish Details",
        activeDescription:
          "A calm reading view for the family dish, so cooking details stay easy to revisit before editing.",
        archivedDescription:
          "This dish lives in Archived for now. You can still read it, edit it, and restore it when it belongs back in the active family library.",
      },
      archivedBadge: "Archived dish",
      archivedNotice: {
        title: "Archived dishes stay safe here",
        description:
          "Restoring this dish will place it back in the Active Dish Library.",
      },
      sections: {
        ingredients: "Ingredients",
        cookingSteps: "Cooking steps",
        notes: "Notes",
      },
      empty: {
        ingredients: "No ingredients were added for this dish yet.",
        cookingSteps: "No cooking steps were added for this dish yet.",
        notes: "No notes were added for this dish yet.",
      },
    },
    form: {
      header: {
        eyebrow: "Dish Form",
        createTitle: "Add Dish",
        editTitle: "Edit Dish",
        createDescription:
          "Create a family dish with the fields needed for MVP planning and shopping list generation.",
        editDescription:
          "Adjust the dish details, notes, recipe text, and ingredients for the shared family dish database.",
      },
      badges: {
        newDish: "New dish",
        editMode: "Edit mode",
      },
      fields: {
        dishName: "Dish name",
        category: "Category",
        comment: "Comment",
        recipeText: "Recipe text",
        ingredient: "Ingredient",
        quantity: "Quantity",
        unit: "Unit",
      },
      placeholders: {
        dishName: "Tomato soup",
        comment: "A short family note or serving reminder",
        recipeText: "Write the simple preparation steps here",
        ingredient: "Tomatoes",
      },
      ingredients: {
        title: "Ingredients",
        description:
          "Add only the MVP values needed for planning and shopping list generation.",
        rowsCount: "{count} rows",
        addRow: "Add ingredient row",
        removeRow: "Remove row",
      },
      actions: {
        title: "Form actions",
        saveDish: "Save dish",
        saveChanges: "Save changes",
        saving: "Saving...",
      },
    },
  },
};
