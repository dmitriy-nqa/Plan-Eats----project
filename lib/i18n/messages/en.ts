import type { TranslationMessages } from "@/lib/i18n/config";

export const enMessages: TranslationMessages = {
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
};
