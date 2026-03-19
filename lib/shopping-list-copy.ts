import type { AppLocale } from "@/lib/i18n/config";

export function getShoppingListCopy(locale: AppLocale) {
  if (locale === "ru") {
    return {
      setup: {
        title: "Supabase не настроен",
        listDescription:
          "Список покупок не сможет загрузиться, пока локальные переменные Supabase не настроены.",
        formDescription:
          "Форма списка покупок не сможет загрузиться или сохранить данные, пока локальные переменные Supabase не настроены.",
        hint: "Заполните .env.local на основе .env.example и перезапустите npm.cmd run dev.",
      },
      header: {
        eyebrow: "Список покупок",
        title: "Products",
        description: "Список на эту неделю, собранный из Weekly Menu и готовый к спокойной ручной правке.",
      },
      weekCard: {
        title: "Текущая неделя",
        description: "Собрано из Weekly Menu",
      },
      summary: {
        toBuy: "{count} купить",
        bought: "{count} куплено",
      },
      row: {
        sourceLabel: "Источник",
        sourceAuto: "добавлено из Weekly Menu",
        sourceManual: "добавлено вручную",
        markBought: "Отметить",
        bought: "Куплено",
      },
      sections: {
        toBuy: "Купить",
        bought: "Куплено",
      },
      actions: {
        addItem: "Добавить позицию",
        editItem: "Изменить",
        removeItem: "Удалить",
        hideItem: "Скрыть",
        retry: "Повторить",
        backToWeeklyMenu: "Перейти в Weekly Menu",
        saveItem: "Сохранить позицию",
        saveChanges: "Сохранить изменения",
        saving: "Сохранение...",
      },
      empty: {
        title: "Список покупок пока пуст",
        description:
          "Products собирается из блюд, которые выбраны в Weekly Menu. Когда план появится, покупки появятся здесь.",
        manualHint: "Можно начать и с ручной позиции, если нужно купить что-то отдельно.",
      },
      error: {
        title: "Не удалось загрузить список покупок",
        description: "Попробуйте обновить экран ещё раз.",
      },
      form: {
        addTitle: "Добавить позицию",
        editTitle: "Изменить позицию",
        addDescription:
          "Добавьте покупку на эту неделю. Она сохранится как вручную добавленная позиция списка.",
        editDescription:
          "Измените название, количество или единицу, чтобы список на эту неделю читался понятнее.",
        nameLabel: "Название",
        quantityLabel: "Количество",
        unitLabel: "Единица",
        namePlaceholder: "Молоко",
        quantityPlaceholder: "2",
        validationNameRequired: "Название позиции обязательно.",
        validationQuantityInvalid: "Количество должно быть больше нуля.",
        validationFixErrors: "Проверьте поля формы и попробуйте снова.",
        validationSaveFailed:
          "Сейчас не удалось сохранить позицию. Данные остались в форме, так что можно исправить их и попробовать снова.",
        backToProducts: "Назад к списку",
        deleteManual: "Удалить позицию",
        hideAuto: "Скрыть на эту неделю",
        sourceCardLabel: "Источник позиции",
        sourceAdd: "Добавлено вручную",
        sourceManualEdit:
          "Эта позиция была добавлена вручную и останется отдельной от автособранного списка.",
        sourceAutoEdit:
          "Эта позиция пришла из Weekly Menu. Правка здесь меняет только то, как она выглядит в списке покупок на эту неделю.",
      },
    };
  }

  return {
    setup: {
      title: "Supabase is not configured",
      listDescription:
        "The shopping list cannot load until local Supabase variables are configured.",
      formDescription:
        "The shopping list form cannot load or save data until local Supabase variables are configured.",
      hint: "Fill in .env.local from .env.example and restart npm.cmd run dev.",
    },
    header: {
      eyebrow: "Shopping List",
      title: "Products",
      description: "This week’s list, built from Weekly Menu and ready for quick manual edits.",
    },
    weekCard: {
      title: "This week",
      description: "Built from Weekly Menu",
    },
    summary: {
      toBuy: "{count} to buy",
      bought: "{count} bought",
    },
    row: {
      sourceLabel: "Source",
      sourceAuto: "added from Weekly Menu",
      sourceManual: "added manually",
      markBought: "Mark bought",
      bought: "Bought",
    },
    sections: {
      toBuy: "To buy",
      bought: "Bought",
    },
    actions: {
      addItem: "Add item",
      editItem: "Edit",
      removeItem: "Delete",
      hideItem: "Hide",
      retry: "Retry",
      backToWeeklyMenu: "Go to Weekly Menu",
      saveItem: "Save item",
      saveChanges: "Save changes",
      saving: "Saving...",
    },
    empty: {
      title: "Your shopping list is still empty",
      description:
        "Products is built from the dishes you plan in Weekly Menu. Once the week is filled, the shopping list will appear here.",
      manualHint: "You can still start with a manual item if something needs to be bought separately.",
    },
    error: {
      title: "Could not load the shopping list",
      description: "Try refreshing the screen again.",
    },
    form: {
      addTitle: "Add item",
      editTitle: "Edit item",
      addDescription:
        "Add a purchase for this week. It will stay in the shopping list as a manually added item.",
      editDescription:
        "Update the name, quantity, or unit so the list for this week reads clearly.",
      nameLabel: "Name",
      quantityLabel: "Quantity",
      unitLabel: "Unit",
      namePlaceholder: "Milk",
      quantityPlaceholder: "2",
      validationNameRequired: "Item name is required.",
      validationQuantityInvalid: "Quantity must be greater than 0.",
      validationFixErrors: "Check the highlighted fields and try again.",
      validationSaveFailed:
        "We could not save this item right now. Your changes are still in the form so you can fix and try again.",
      backToProducts: "Back to Products",
      deleteManual: "Delete item",
      hideAuto: "Hide for this week",
      sourceCardLabel: "Where this item came from",
      sourceAdd: "Added manually",
      sourceManualEdit:
        "This item was added manually and will stay separate from the generated shopping list.",
      sourceAutoEdit:
        "This item came from Weekly Menu. Editing it here changes how it appears in the shopping list for this week.",
    },
  };
}

export function formatShoppingListCopy(
  template: string,
  params: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}
