import { notFound } from "next/navigation";

import { archiveDishAction, restoreDishAction } from "../actions";

import { DishDetailsScreen } from "@/components/screens/dish-details-screen";
import { SetupState } from "@/components/ui/setup-state";
import { fetchDishWithIngredients } from "@/lib/dish-crud";
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
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title="Supabase is not configured"
        description="Dish details cannot load until local Supabase variables are configured."
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

  return (
    <DishDetailsScreen
      dish={dish}
      mode={mode}
      archiveAction={archiveDishAction}
      restoreAction={restoreDishAction}
    />
  );
}
