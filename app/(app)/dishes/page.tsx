import { DishListScreen } from "@/components/screens/dish-list-screen";
import { fetchDishesByMode } from "@/lib/dish-crud";
import { parseDishLibraryMode } from "@/lib/dishes";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

type DishesPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DishesPage({ searchParams }: DishesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mode = parseDishLibraryMode(resolvedSearchParams?.mode);
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <DishListScreen
        initialDishes={[]}
        mode={mode}
        errorMessage={`${configurationError}. Create a .env.local from .env.example and restart the dev server.`}
      />
    );
  }

  try {
    const dishes = await fetchDishesByMode(mode);

    return <DishListScreen initialDishes={dishes} mode={mode} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <DishListScreen
        initialDishes={[]}
        mode={mode}
        errorMessage={message}
      />
    );
  }
}
