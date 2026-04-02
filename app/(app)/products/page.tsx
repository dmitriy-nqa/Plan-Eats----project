import {
  deleteShoppingListItemAction,
  toggleShoppingListItemCheckedAction,
} from "./shopping-actions";

import { ShoppingListScreen } from "@/components/screens/shopping-list-screen";
import { SetupState } from "@/components/ui/setup-state";
import { getRequestLocale } from "@/lib/i18n/server";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import type { CurrentWeekShoppingListPageData } from "@/lib/shopping-list-read";
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

  let pageData: CurrentWeekShoppingListPageData = {
    hasMealPlan: false,
    snapshot: null,
    status: null,
    isSyncPending: false,
  };
  let errorMessage: string | undefined;

  try {
    const {
      fetchCurrentWeekPublishedShoppingListPageData,
    } = await import("@/lib/shopping-list-read");

    pageData = await fetchCurrentWeekPublishedShoppingListPageData();
  } catch (error) {
    console.error("Failed to load current-week shopping list", error);
    errorMessage = error instanceof Error ? error.message : copy.error.description;
  }

  return (
    <ShoppingListScreen
      hasMealPlan={pageData.hasMealPlan}
      snapshot={pageData.snapshot}
      readStatus={pageData.status}
      isSyncPending={pageData.isSyncPending}
      errorMessage={errorMessage}
      toggleCheckedAction={toggleShoppingListItemCheckedAction}
      deleteItemAction={deleteShoppingListItemAction}
    />
  );
}

