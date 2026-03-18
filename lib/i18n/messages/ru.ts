import type { TranslationMessages } from "@/lib/i18n/config";

export const ruMessages: TranslationMessages = {
  common: {
    actions: {
      save: "Сохранить",
      cancel: "Отмена",
      back: "Назад",
      edit: "Редактировать",
      archive: "Архивировать",
      restore: "Восстановить",
      delete: "Удалить",
      close: "Закрыть",
      search: "Поиск",
      clear: "Очистить",
    },
    locale: {
      ru: "Русский",
      en: "English",
    },
  },
  domain: {
    mealType: {
      breakfast: "Завтрак",
      lunch: "Обед",
      dinner: "Ужин",
    },
    dishCategory: {
      breakfast: "Завтрак",
      soup: "Суп",
      salad: "Салат",
      mainCourse: "Основное блюдо",
      bakeryAndDesserts: "Выпечка и десерты",
    },
  },
  settings: {
    header: {
      eyebrow: "Общее пространство",
      title: "Настройки",
      description:
        "Минималистичный экран для семейных и планировочных настроек. В MVP он остаётся намеренно лёгким.",
    },
    family: {
      label: "Семья",
      name: "Дом Plan&Eat",
      description: "Общее пространство для двух пользователей семьи.",
    },
    planningMode: {
      label: "Режим планирования",
      description: "В MVP используется фиксированный недельный план на 7 дней.",
    },
    secondUser: {
      label: "Второй пользователь",
      description: "Временный блок для деталей общей семейной настройки.",
    },
    language: {
      label: "Язык",
    },
  },
  weeklyMenu: {
    header: {
      eyebrow: "Главный экран",
      title: "Меню на неделю",
      description:
        "Нажмите на пустой слот, чтобы выбрать блюдо. Нажмите на заполненный слот, чтобы открыть детали блюда перед готовкой, а затем при необходимости заменить его или очистить слот.",
    },
    hero: {
      title: "Текущая семейная неделя",
      withMealPlan: "План питания на эту неделю уже создан.",
      empty: "Эта неделя пока пустая. Первое назначение блюда создаст план питания.",
    },
    overview: {
      title: "Обзор недели",
      description: "Нажмите на день, чтобы переключить активный план ниже.",
    },
    day: {
      noMealsAssigned: "Блюда еще не выбраны.",
      mealsAssigned: "Назначено {filled} из {total} приемов пищи.",
      today: "Сегодня",
    },
    slot: {
      chooseDish: "Выберите блюдо",
      pick: "Выбрать",
      archived: "В архиве",
    },
    picker: {
      eyebrow: "Выбор блюда",
      replaceEyebrow: "Заменить блюдо",
      backToDetails: "Назад к деталям",
      searchLabel: "Поиск блюд",
      searchPlaceholder: "Поиск блюд",
      summaryFallback: "Пока нет короткого описания.",
      empty: {
        title: "Пока нет блюд для выбора",
        description:
          "Добавьте первое семейное блюдо, затем вернитесь сюда и назначьте его на эту неделю.",
        cta: "Добавить блюдо",
      },
      noResults: {
        title: "Подходящих блюд не найдено",
        description: "Попробуйте другое слово для поиска или очистите поле.",
      },
    },
    details: {
      title: "Детали блюда",
      fallbackTitle: "Детали блюда",
      archived: "Блюдо в архиве",
      cookNote: "Кулинарная заметка",
      ingredients: "Ингредиенты",
      noIngredients: "Для этого блюда пока не добавлены ингредиенты.",
      howToCook: "Как готовить",
      noCookingSteps: "Для этого блюда пока не добавлены шаги приготовления.",
      notes: "Заметки",
      unavailable: {
        title: "Детали блюда недоступны",
        description:
          "Этот слот все еще связан с блюдом, но его детали не удалось загрузить. Вы можете заменить блюдо или очистить слот.",
      },
      replace: "Заменить",
      confirmClear: "Очистить {mealLabel} на {dayLabel}, {dateLabel}?",
    },
    errors: {
      title: "Не удалось загрузить меню на неделю",
      retry: "Повторить",
      configurationHelp:
        "Заполните .env.local и перезапустите сервер, чтобы использовать общее недельное меню.",
      unknown: "Неизвестная ошибка",
    },
    empty: {
      title: "Меню на неделю готово к реальным данным",
      description:
        "Добавьте хотя бы одно неархивное блюдо, затем вернитесь сюда и назначьте его в слот.",
      cta: "Добавить первое блюдо",
    },
    status: {
      unavailableDish: "Недоступное блюдо",
    },
    sheet: {
      closeAriaLabel: "Закрыть панель слота",
    },
  },
};
