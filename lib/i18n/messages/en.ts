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
        "Tap any slot to open its meal flow, review the current dishes, and adjust the plan without leaving the weekly rhythm.",
    },
    hero: {
      title: "Current family week",
      withMealPlan: "The weekly menu is already set for this week.",
      empty: "This week is still empty. The first slot assignment will begin filling your Weekly Menu.",
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
    slotFlow: {
      eyebrow: "Slot",
      emptyTitle: "This meal slot is still empty",
      emptyDescription: "Start with one dish, then add more only if this meal needs it.",
      addFirst: "Add first dish",
      addMore: "Add more dishes",
      remove: "Remove",
      removeConfirm: "Remove this dish from {mealLabel} on {dayLabel}, {dateLabel}?",
      backToSlot: "Back to slot",
      alreadyInSlot: "Already in this slot",
      duplicateNotice: "This dish is already in the slot.",
      actionFailed: "Could not update this slot right now. Try again.",
    },
    reuse: {
      itemAction: "Copy",
      slotAction: "Copy full slot",
      itemEyebrow: "Copy Dish",
      slotEyebrow: "Copy Slot",
      backToSlot: "Back to slot",
      sourceDish: "Dish to copy",
      sourceSlot: "Slot to copy",
      itemDescription: "Pick another day and meal slot in this week for this dish.",
      slotDescription:
        "Copy every dish in this slot to another empty meal slot in this week.",
      independentHint: "The copy is independent and will not stay linked to the source.",
      targetDay: "Choose day",
      targetMeal: "Choose meal slot",
      currentSlot: "Current slot",
      targetAlreadyContainsDish: "Dish already there",
      targetRequiresEmpty: "Only empty slots are available",
      emptyTarget: "Empty slot",
      filledTarget: "{count} dishes",
      pickTarget: "Copy here",
      noTargetsTitle: "No available targets",
      noItemTargetsDescription:
        "This dish cannot be copied into another slot this week.",
      noSlotTargetsDescription:
        "Only empty slots are available for full-slot copy this week.",
      activeOnlyNotice: "Reuse is available only for active dishes.",
    },
    picker: {
      eyebrow: "Dish Picker",
      replaceEyebrow: "Replace Dish",
      backToDetails: "Back to slot",
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
    productsBridge: {
      title: "Products",
      emptyPlan:
        "Products builds from your weekly dishes and stays ready for separate buys too.",
      noItems: "Products is collecting this week's dishes.",
      ready: "This week's shopping is already gathered.",
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
      activeDescription: "Active dishes are ready to be added to Weekly Menu and used throughout the week.",
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
          cta: "Go to active",
        },
      },
    },
    details: {
      header: {
        eyebrow: "Dish Details",
        activeDescription:
          "A calm reading view for the family dish, so cooking details stay easy to revisit before editing or adding it to Weekly Menu.",
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
      validation: {
        fixErrors: "Check the highlighted fields and try saving again.",
        nameRequired: "Dish name is required.",
        ingredientIncomplete:
          "Ingredient row {row}: fill both ingredient and quantity or leave the row empty.",
        ingredientQuantityInvalid:
          "Ingredient row {row}: quantity must be greater than 0.",
        saveFailed:
          "We could not save this dish right now. Your changes are still in the form, so you can fix and try again.",
      },
      productLink: {
        linkedTo: "Linked to: {name}",
        archived: "Archived product",
        unlink: "Unlink",
        relink: "Relink",
        useProduct: "Use product",
        suggestionsTitle: "Existing products",
        matchCanonical: "Canonical name match",
        matchAlias: "Alias match",
        matchToken: "Word order match",
        matchPartial: "Similar existing product",
        archivedMatch:
          "This ingredient matches archived product \"{name}\". Restore it instead of creating a new duplicate.",
        openArchived: "Open archived product",
      },
    },
  },
  products: {
    setup: {
      title: "Supabase is not configured",
      listDescription:
        "The Products dictionary cannot load until local Supabase variables are configured.",
      newDescription:
        "The Add Product form cannot save yet because local Supabase environment variables are missing.",
      editDescription:
        "The Edit Product form cannot load or save data until local Supabase variables are configured.",
      hint:
        "Fill in .env.local from .env.example and restart npm.cmd run dev.",
    },
    navigation: {
      backToLibrary: "Back to Product Dictionary",
    },
    mode: {
      active: "Active",
      archived: "Archived",
    },
    actions: {
      addProduct: "Add product",
    },
    search: {
      label: "Search products",
      placeholder: "Search products",
    },
    header: {
      eyebrow: "Family Product Dictionary",
      title: "Products",
      description:
        "Keep canonical family products tidy, manage aliases, and link dishes to the right ingredient names without turning the app into an admin catalog.",
    },
    list: {
      count: "{count} products",
      aliasCount: "{count} aliases",
      activeDescription:
        "Active products are ready to be reused in dishes and future shopping generation.",
      archivedDescription:
        "Archived products stay safe here for history, restore, and cleanup without cluttering active suggestions.",
      errorTitle: "Could not load Products",
      unknownError: "Unknown error",
      empty: {
        search: {
          title: "No products match this search",
          description:
            "Try a different word or clear the search field to browse the product dictionary again.",
        },
        active: {
          title: "Your product dictionary is still empty",
          description:
            "Start with a few canonical products so dishes can link to cleaner, reusable ingredient names.",
        },
        archived: {
          title: "Archived products will appear here",
          description:
            "When you archive a product, it leaves the active dictionary and stays here until you restore it.",
        },
      },
    },
    form: {
      header: {
        eyebrow: "Product Form",
        createTitle: "Add Product",
        editTitle: "Edit Product",
        createDescription:
          "Create a canonical family product and optional aliases for the ingredient names your household actually uses.",
        editDescription:
          "Adjust the canonical product name, aliases, archive state, and duplicate cleanup actions.",
      },
      badges: {
        newProduct: "New product",
        editMode: "Edit mode",
        archived: "Archived",
      },
      fields: {
        displayName: "Product name",
      },
      placeholders: {
        displayName: "Tomato",
        alias: "Pomidor",
      },
      aliases: {
        title: "Also known as",
        description:
          "Add the household variants that should still resolve to the same canonical product.",
        rowsCount: "{count} rows",
        addRow: "Add alias row",
        removeRow: "Remove row",
      },
      actions: {
        title: "Form actions",
        saveProduct: "Save product",
        saveChanges: "Save changes",
        saving: "Saving...",
      },
      duplicate: {
        canonical:
          "This name already belongs to product \"{name}\". Open it instead of creating a duplicate.",
        alias:
          "This name is already saved as alias \"{alias}\" for product \"{name}\". Use the existing product instead.",
        token:
          "This looks like the same product as \"{name}\" with a different word order. Use the existing product instead.",
        archived:
          "This name already belongs to archived product \"{name}\". Restore it instead of creating a duplicate.",
        openExisting: "Open existing product",
        openArchived: "Open archived product",
      },
      validation: {
        fixErrors: "Check the highlighted fields and try saving again.",
        displayNameRequired: "Product name is required.",
        aliasDuplicate: "This alias is already repeated in the form.",
        aliasMatchesDisplayName: "This alias matches the canonical product name.",
        saveFailed:
          "We could not save this product right now. Your changes are still in the form, so you can fix and try again.",
      },
    },
    details: {
      manageTitle: "Product state",
      activeDescription:
        "Archive a product when you do not want it in active suggestions, or keep editing the canonical dictionary entry here.",
      archivedDescription:
        "Archived products still protect against duplicates and keep existing dish links valid until you restore them.",
    },
    merge: {
      title: "Merge duplicate into another product",
      description:
        "Use this narrow cleanup step when two products should become one canonical entry. Existing dish links will move to the target product.",
      fields: {
        targetProduct: "Target product",
      },
      placeholders: {
        targetProduct: "Choose target product",
      },
      actions: {
        merge: "Merge product",
        merging: "Merging...",
      },
      validation: {
        targetRequired: "Choose a target product before merging.",
        failed: "We could not merge this product right now. Try again after checking the target.",
      },
    },
  },
};
