import { notFound } from "next/navigation";

import { updateDishAction } from "../../actions";

import { DishFormScreen } from "@/components/screens/dish-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { createEmptyIngredient } from "@/lib/dish-form";
import { fetchDishWithIngredients } from "@/lib/dish-crud";
import { parseDishLibraryMode } from "@/lib/dishes";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditDishPage({
  params,
  searchParams,
}: {
  params: Promise<{ dishId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title="Supabase is not configured"
        description="The Edit Dish form cannot load or save data until local Supabase variables are configured."
        hint={`${configurationError}. Fill in .env.local from .env.example and restart npm.cmd run dev.`}
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
    />
  );
}
