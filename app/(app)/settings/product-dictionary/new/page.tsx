import { createProductAction } from "@/app/(app)/products/actions";
import { ProductFormScreen } from "@/components/screens/product-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { addProductDraft } from "@/lib/product-form";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export default async function NewProductDictionaryPage() {
  const locale = await getRequestLocale();
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={getTranslation(locale, "products.setup.title")}
        description={getTranslation(locale, "products.setup.newDescription")}
        hint={getTranslation(locale, "products.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.products")}
        ctaLabel={getTranslation(locale, "products.navigation.backToLibrary")}
      />
    );
  }

  return (
    <ProductFormScreen
      mode="add"
      initialValues={addProductDraft}
      saveAction={createProductAction}
    />
  );
}
