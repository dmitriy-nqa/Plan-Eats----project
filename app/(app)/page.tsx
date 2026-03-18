import { Suspense } from "react";

import { assignWeeklySlotAction, clearWeeklySlotAction } from "./weekly-menu-actions";

import {
  WeeklyMenuScreen,
  WeeklyMenuScreenSkeleton,
} from "@/components/screens/weekly-menu-screen";
import { fetchActiveDishes } from "@/lib/dish-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";
import { buildEmptyWeeklyMenuView } from "@/lib/weekly-menu";
import { fetchCurrentWeekMenu } from "@/lib/weekly-menu-crud";

export const dynamic = "force-dynamic";

export default function WeeklyMenuPage() {
  return (
    <Suspense fallback={<WeeklyMenuScreenSkeleton />}>
      <WeeklyMenuPageContent />
    </Suspense>
  );
}

async function WeeklyMenuPageContent() {
  const locale = await getRequestLocale();
  const configurationError = getSupabaseConfigurationError();
  const fallbackMenu = buildEmptyWeeklyMenuView(undefined, locale);

  if (configurationError) {
    return (
      <WeeklyMenuScreen
        menu={fallbackMenu}
        dishes={[]}
        assignAction={assignWeeklySlotAction}
        clearAction={clearWeeklySlotAction}
        errorMessage={`${configurationError}. ${getTranslation(locale, "weeklyMenu.errors.configurationHelp")}`}
      />
    );
  }

  try {
    const [menu, dishes] = await Promise.all([
      fetchCurrentWeekMenu(locale),
      fetchActiveDishes(locale),
    ]);

    return (
      <WeeklyMenuScreen
        menu={menu}
        dishes={dishes}
        assignAction={assignWeeklySlotAction}
        clearAction={clearWeeklySlotAction}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : getTranslation(locale, "weeklyMenu.errors.unknown");

    return (
      <WeeklyMenuScreen
        menu={fallbackMenu}
        dishes={[]}
        assignAction={assignWeeklySlotAction}
        clearAction={clearWeeklySlotAction}
        errorMessage={message}
      />
    );
  }
}
