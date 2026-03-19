import { ProductsListScreen } from "@/components/screens/products-list-screen";
import { SetupState } from "@/components/ui/setup-state";
import { fetchProductsByMode } from "@/lib/product-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { parseProductLibraryMode } from "@/lib/products";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

type ProductDictionaryPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDictionaryPage({
  searchParams,
}: ProductDictionaryPageProps) {
  const locale = await getRequestLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mode = parseProductLibraryMode(resolvedSearchParams?.mode);
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={getTranslation(locale, "products.setup.title")}
        description={getTranslation(locale, "products.setup.listDescription")}
        hint={getTranslation(locale, "products.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.products")}
        ctaLabel={getTranslation(locale, "products.navigation.backToLibrary")}
      />
    );
  }

  try {
    const products = await fetchProductsByMode(mode);
    return <ProductsListScreen initialProducts={products} mode={mode} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : getTranslation(locale, "products.list.unknownError");

    return (
      <ProductsListScreen
        initialProducts={[]}
        mode={mode}
        errorMessage={message}
      />
    );
  }
}
