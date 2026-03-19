import {
  deleteShoppingListItemAction,
  toggleShoppingListItemCheckedAction,
} from "./shopping-actions";

import { ShoppingListScreen } from "@/components/screens/shopping-list-screen";
import { SetupState } from "@/components/ui/setup-state";
import { getRequestLocale } from "@/lib/i18n/server";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import type { CurrentWeekShoppingListSnapshot } from "@/lib/shopping-list-crud";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const locale = await getRequestLocale();
  const copy = getShoppingListCopy(locale);
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={copy.setup.title}
        description={copy.setup.listDescription}
        hint={copy.setup.hint}
        badgeLabel="PR"
        ctaLabel={copy.actions.backToWeeklyMenu}
        ctaHref="/"
      />
    );
  }

  let hasMealPlan = false;
  let snapshot: CurrentWeekShoppingListSnapshot | null = null;
  let errorMessage: string | undefined;

  try {
    const {
      ensureCurrentWeekShoppingListFresh,
      fetchCurrentWeekShoppingListPageData,
    } = await import("@/lib/shopping-list-crud");

    await ensureCurrentWeekShoppingListFresh();
    const pageData = await fetchCurrentWeekShoppingListPageData();
    hasMealPlan = pageData.hasMealPlan;
    snapshot = pageData.snapshot;
  } catch (error) {
    console.error("Failed to load current-week shopping list", error);
    errorMessage = error instanceof Error ? error.message : copy.error.description;
  }

  return (
    <ShoppingListScreen
      hasMealPlan={hasMealPlan}
      snapshot={snapshot}
      errorMessage={errorMessage}
      toggleCheckedAction={toggleShoppingListItemCheckedAction}
      deleteItemAction={deleteShoppingListItemAction}
    />
  );
}
