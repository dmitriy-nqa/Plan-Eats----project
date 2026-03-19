import { createShoppingListItemAction } from "../shopping-actions";

import { ShoppingListItemFormScreen } from "@/components/screens/shopping-list-item-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { getRequestLocale } from "@/lib/i18n/server";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import { addShoppingListItemDraft } from "@/lib/shopping-list-form";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export default async function NewShoppingListItemPage() {
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

  return (
    <ShoppingListItemFormScreen
      mode="add"
      initialValues={addShoppingListItemDraft}
      saveAction={createShoppingListItemAction}
    />
  );
}
