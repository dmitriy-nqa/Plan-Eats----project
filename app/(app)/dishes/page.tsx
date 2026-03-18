import { DishListScreen } from "@/components/screens/dish-list-screen";
import { fetchDishesByMode } from "@/lib/dish-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { parseDishLibraryMode } from "@/lib/dishes";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

type DishesPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DishesPage({ searchParams }: DishesPageProps) {
  const locale = await getRequestLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mode = parseDishLibraryMode(resolvedSearchParams?.mode);
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <DishListScreen
        initialDishes={[]}
        mode={mode}
        errorMessage={getTranslation(locale, "dishes.setup.hint")}
      />
    );
  }

  try {
    const dishes = await fetchDishesByMode(mode, locale);

    return <DishListScreen initialDishes={dishes} mode={mode} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : getTranslation(locale, "dishes.library.unknownError");

    return (
      <DishListScreen
        initialDishes={[]}
        mode={mode}
        errorMessage={message}
      />
    );
  }
}
