import { notFound } from "next/navigation";

import {
  deleteShoppingListItemAction,
  updateShoppingListItemAction,
} from "../../shopping-actions";

import { ShoppingListItemFormScreen } from "@/components/screens/shopping-list-item-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { getRequestLocale } from "@/lib/i18n/server";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditShoppingListItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const locale = await getRequestLocale();
  const copy = getShoppingListCopy(locale);
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={copy.setup.title}
        description={copy.setup.formDescription}
        hint={copy.setup.hint}
        badgeLabel="PR"
        ctaLabel={copy.form.backToProducts}
        ctaHref="/products"
      />
    );
  }

  const { itemId } = await params;
  const { fetchCurrentWeekPublishedShoppingListItem } = await import(
    "@/lib/shopping-list-read"
  );
  const item = await fetchCurrentWeekPublishedShoppingListItem(itemId);

  if (!item) {
    notFound();
  }

  return (
    <ShoppingListItemFormScreen
      mode="edit"
      initialValues={{
        ingredientName: item.ingredientName,
        quantity: item.quantity,
        unit: item.unit,
      }}
      saveAction={updateShoppingListItemAction}
      itemId={item.id}
      sourceType={item.sourceType}
      deleteAction={deleteShoppingListItemAction}
    />
  );
}
