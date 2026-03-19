import { notFound } from "next/navigation";

import { updateDishAction } from "../../actions";

import { DishFormScreen } from "@/components/screens/dish-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { createEmptyIngredient } from "@/lib/dish-form";
import { fetchDishWithIngredients } from "@/lib/dish-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { parseDishLibraryMode } from "@/lib/dishes";
import { fetchProductSuggestions } from "@/lib/product-crud";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditDishPage({
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
        description={getTranslation(locale, "dishes.setup.editDescription")}
        hint={getTranslation(locale, "dishes.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.dishLibrary")}
        ctaLabel={getTranslation(locale, "dishes.navigation.backToLibrary")}
      />
    );
  }

  const { dishId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const dish = await fetchDishWithIngredients(dishId);
  const productSuggestions = await fetchProductSuggestions();

  if (!dish) {
    notFound();
  }

  const mode =
    resolvedSearchParams?.mode !== undefined
      ? parseDishLibraryMode(resolvedSearchParams.mode)
      : dish.isArchived
        ? "archived"
        : "active";

  const initialValues = {
    ...dish,
    ingredients:
      dish.ingredients.length > 0
        ? dish.ingredients
        : [createEmptyIngredient("ingredient-1")],
  };

  return (
    <DishFormScreen
      mode="edit"
      initialValues={initialValues}
      saveAction={updateDishAction}
      dishId={dish.id}
      libraryMode={mode}
      productSuggestions={productSuggestions}
    />
  );
}
