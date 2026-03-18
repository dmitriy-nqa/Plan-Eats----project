import { notFound } from "next/navigation";

import { archiveDishAction, restoreDishAction } from "../actions";

import { DishDetailsScreen } from "@/components/screens/dish-details-screen";
import { SetupState } from "@/components/ui/setup-state";
import { fetchDishWithIngredients } from "@/lib/dish-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { parseDishLibraryMode } from "@/lib/dishes";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DishDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ dishId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const locale = await getRequestLocale();
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={getTranslation(locale, "dishes.setup.title")}
        description={getTranslation(locale, "dishes.setup.detailsDescription")}
        hint={getTranslation(locale, "dishes.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.dishLibrary")}
        ctaLabel={getTranslation(locale, "dishes.navigation.backToLibrary")}
      />
    );
  }

  const { dishId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const dish = await fetchDishWithIngredients(dishId);

  if (!dish) {
    notFound();
  }

  const mode =
    resolvedSearchParams?.mode !== undefined
      ? parseDishLibraryMode(resolvedSearchParams.mode)
      : dish.isArchived
        ? "archived"
        : "active";

  return (
    <DishDetailsScreen
      dish={dish}
      mode={mode}
      archiveAction={archiveDishAction}
      restoreAction={restoreDishAction}
    />
  );
}
