import type { AppLocale } from "@/lib/i18n/config";

export type ShoppingFlowState =
  | "emptyPlan"
  | "syncing"
  | "noItems"
  | "inProgress"
  | "complete";

type ShoppingFlowStateInput = {
  hasMealPlan: boolean;
  isSyncPending?: boolean;
  totalItems: number;
  toBuyCount: number;
  boughtCount?: number;
};

type ShoppingListCopy = {
  setup: {
    title: string;
    listDescription: string;
    formDescription: string;
    hint: string;
  };
  header: {
    eyebrow: string;
    title: string;
    description: string;
  };
  weekCard: {
    title: string;
    description: string;
  };
  summary: {
    toBuy: string;
    bought: string;
  };
  row: {
    sourceLabel: string;
    sourceAuto: string;
    sourceManual: string;
    markBought: string;
    bought: string;
  };
  sections: {
    toBuy: string;
    bought: string;
  };
  actions: {
    addItem: string;
    editItem: string;
    removeItem: string;
    hideItem: string;
    confirmHideItem: string;
    retry: string;
    backToWeeklyMenu: string;
    saveItem: string;
    saveChanges: string;
    saving: string;
  };
  empty: {
    title: string;
    description: string;
    manualHint: string;
  };
  pending: {
    title: string;
    description: string;
    manualHint: string;
  };
  controlStates: {
    stalePending: {
      label: string;
      title: string;
      description: string;
    };
    updating: {
      label: string;
      title: string;
      description: string;
    };
    failedLatest: {
      label: string;
      title: string;
      description: string;
      failureReasonPrefix: string;
    };
    noProjection: {
      label: string;
      title: string;
      description: string;
    };
  };
  error: {
    title: string;
    description: string;
  };
  form: {
    addTitle: string;
    editTitle: string;
    addDescription: string;
    editDescription: string;
    nameLabel: string;
    quantityLabel: string;
    unitLabel: string;
    namePlaceholder: string;
    quantityPlaceholder: string;
    validationNameRequired: string;
    validationQuantityInvalid: string;
    validationFixErrors: string;
    validationSaveFailed: string;
    backToProducts: string;
    deleteManual: string;
    hideAuto: string;
    sourceCardLabel: string;
    sourceAdd: string;
    sourceManualEdit: string;
    sourceAutoEdit: string;
  };
  flow: {
    bridge: Record<ShoppingFlowState, string>;
    productsTop: {
      supporting: string;
      stateDescriptions: Record<ShoppingFlowState, string>;
    };
    completeNote: string;
  };
};

const shoppingListCopyByLocale: Record<AppLocale, ShoppingListCopy> = {
  ru: {
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
      title: "Продукты",
      description:
        "Список покупок на эту неделю, собранный из Weekly Menu и готовый к быстрым ручным правкам.",
    },
    weekCard: {
      title: "Эта неделя",
      description: "Список покупок на эту неделю",
    },
    summary: {
      toBuy: "Купить: {count}",
      bought: "Куплено: {count}",
    },
    row: {
      sourceLabel: "Источник",
      sourceAuto: "добавлено из Weekly Menu",
      sourceManual: "добавлено вручную",
      markBought: "Отметить как купленное",
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
      hideItem: "Убрать из списка",
      confirmHideItem: "Убрать эту позицию из списка покупок на эту неделю?",
      retry: "Попробовать снова",
      backToWeeklyMenu: "К Weekly Menu",
      saveItem: "Сохранить позицию",
      saveChanges: "Сохранить изменения",
      saving: "Сохранение...",
    },
    empty: {
      title: "Список покупок пока пуст",
      description:
        "Список покупок собирается из блюд, которые выбраны в меню на неделю. Когда план появится, покупки будут здесь.",
      manualHint:
        "Можно начать и с ручной позиции, если нужно купить что-то отдельно.",
    },
    pending: {
      title: "Список покупок обновляется",
      description:
        "Меню на эту неделю уже есть. Список покупок ещё догружает изменения, поэтому позиции могут появиться не сразу.",
      manualHint:
        "Можно немного подождать и открыть экран ещё раз, либо добавить ручную позицию, если покупка нужна уже сейчас.",
    },
    controlStates: {
      stalePending: {
        label: "Ждёт публикации",
        title: "Показываем последний опубликованный список",
        description:
          "Недавние изменения Weekly Menu ещё ждут публикации, поэтому Products остаётся на последней committed shopping projection.",
      },
      updating: {
        label: "Обновляется",
        title: "Готовится более новая shopping projection",
        description:
          "Products остаётся на последней опубликованной projection, пока следующее обновление ещё в процессе.",
      },
      failedLatest: {
        label: "Ошибка обновления",
        title: "Последний refresh списка не был опубликован",
        description:
          "Products остаётся читаемым, потому что показывает последнюю опубликованную projection вместо того, чтобы притворяться, что новый refresh прошёл успешно.",
        failureReasonPrefix: "Причина последней ошибки:",
      },
      noProjection: {
        label: "Нет baseline",
        title: "Опубликованной shopping projection пока нет",
        description:
          "Эту неделю можно читать без self-heal и bootstrap writes, но Products останется пустым, пока не появится published projection.",
      },
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
        "Измените название, количество или единицу, чтобы список покупок на эту неделю читался понятнее.",
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
      hideAuto: "Убрать из списка",
      sourceCardLabel: "Источник позиции",
      sourceAdd: "Добавлено вручную",
      sourceManualEdit:
        "Эта позиция была добавлена вручную и останется отдельной от автособранного списка покупок.",
      sourceAutoEdit:
        "Позиция пришла из меню на неделю. Здесь меняется только её вид в списке покупок этой недели.",
    },
    flow: {
      bridge: {
        emptyPlan:
          "Когда в меню на неделю появятся блюда, здесь соберётся список покупок.",
        syncing:
          "Меню на неделю уже есть. Список покупок ещё подтягивает последние изменения.",
        noItems:
          "Меню на неделю уже есть, но список покупок пока пуст.",
        inProgress:
          "Список покупок на эту неделю уже собран и готов к покупкам.",
        complete:
          "По списку покупок на эту неделю всё уже отмечено как купленное.",
      },
      productsTop: {
        supporting: "Собрано из меню на неделю",
        stateDescriptions: {
          emptyPlan:
            "Список покупок появится после первого блюда в меню на неделю.",
          syncing:
            "Меню на неделю уже есть. Список покупок ещё обновляется и скоро покажет актуальные позиции.",
          noItems:
            "Меню на неделю уже есть, но в список покупок пока нечего добавить.",
          inProgress:
            "Список покупок на эту неделю собран из меню и готов к покупкам.",
          complete:
            "По текущему списку на эту неделю всё уже куплено.",
        },
      },
      completeNote: "На эту неделю больше ничего не осталось купить.",
    },
  },
  en: {
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
      description:
        "The shopping list for this week, built from the weekly menu and ready for quick manual edits.",
    },
    weekCard: {
      title: "This week",
      description: "Shopping list for this week",
    },
    summary: {
      toBuy: "{count} to buy",
      bought: "{count} bought",
    },
    row: {
      sourceLabel: "Source",
      sourceAuto: "added from the weekly menu",
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
      hideItem: "Remove from list",
      confirmHideItem: "Remove this item from this week's shopping list?",
      retry: "Retry",
      backToWeeklyMenu: "Go to Weekly Menu",
      saveItem: "Save item",
      saveChanges: "Save changes",
      saving: "Saving...",
    },
    empty: {
      title: "Your shopping list is still empty",
      description:
        "The shopping list is built from the dishes planned in the weekly menu. Once the week is filled, it will appear here.",
      manualHint:
        "You can still start with a manual item if something needs to be bought separately.",
    },
    pending: {
      title: "The shopping list is updating",
      description:
        "This week's menu already exists. The shopping list is still pulling in recent changes, so items may appear in a moment.",
      manualHint:
        "You can wait a little and open this screen again, or add a manual item if something needs to be bought right away.",
    },
    controlStates: {
      stalePending: {
        label: "Pending update",
        title: "Showing the last published shopping list",
        description:
          "Recent weekly menu changes are waiting to be published, so Products stays on the latest committed shopping projection for now.",
      },
      updating: {
        label: "Updating",
        title: "A newer shopping projection is still being prepared",
        description:
          "Products is staying on the last published projection while the next refresh is still in progress.",
      },
      failedLatest: {
        label: "Update failed",
        title: "The latest shopping refresh did not publish",
        description:
          "Products is still readable because it is showing the last published projection instead of pretending the newest refresh succeeded.",
        failureReasonPrefix: "Latest failure:",
      },
      noProjection: {
        label: "No baseline",
        title: "No published shopping projection exists yet",
        description:
          "This week can be read without self-healing or bootstrap writes, but Products will stay empty until a published projection exists.",
      },
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
        "Update the name, quantity, or unit so the shopping list for this week reads clearly.",
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
      hideAuto: "Remove from list",
      sourceCardLabel: "Where this item came from",
      sourceAdd: "Added manually",
      sourceManualEdit:
        "This item was added manually and will stay separate from the generated shopping list.",
      sourceAutoEdit:
        "This item came from the weekly menu. Edits here only change how it appears in this week's shopping list.",
    },
    flow: {
      bridge: {
        emptyPlan:
          "Once this week has dishes, the shopping list will gather here.",
        syncing:
          "This week's menu already exists. The shopping list is still catching up with recent changes.",
        noItems:
          "This week's menu already exists, but the shopping list is still empty.",
        inProgress:
          "This week's shopping list is already gathered and ready to use.",
        complete:
          "Everything on this week's shopping list is already marked bought.",
      },
      productsTop: {
        supporting: "Built from the weekly menu",
        stateDescriptions: {
          emptyPlan:
            "The shopping list will appear after the first dish is added to the weekly menu.",
          syncing:
            "This week's menu already exists. The shopping list is still updating and will show the latest items shortly.",
          noItems:
            "This week's menu already exists, but there is nothing to add to the shopping list yet.",
          inProgress:
            "This week's shopping list is built from the weekly menu and ready to use.",
          complete:
            "Everything on this week's list is already bought.",
        },
      },
      completeNote: "Nothing is left to buy for this week.",
    },
  },
};

export function getShoppingFlowState({
  hasMealPlan,
  isSyncPending = false,
  totalItems,
  toBuyCount,
}: ShoppingFlowStateInput): ShoppingFlowState {
  if (!hasMealPlan) {
    return "emptyPlan";
  }

  if (isSyncPending && totalItems === 0) {
    return "syncing";
  }

  if (totalItems === 0) {
    return "noItems";
  }

  if (toBuyCount === 0) {
    return "complete";
  }

  return "inProgress";
}

export function getShoppingListCopy(locale: AppLocale) {
  return shoppingListCopyByLocale[locale];
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
