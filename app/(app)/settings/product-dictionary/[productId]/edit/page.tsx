import { notFound } from "next/navigation";

import {
  archiveProductAction,
  restoreProductAction,
  updateProductAction,
} from "@/app/(app)/products/actions";
import { ProductFormScreen } from "@/components/screens/product-form-screen";
import { SetupState } from "@/components/ui/setup-state";
import { createEmptyAlias } from "@/lib/product-form";
import { fetchProductWithAliases } from "@/lib/product-crud";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/translate";
import { parseProductLibraryMode } from "@/lib/products";
import { getSupabaseConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProductDictionaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const locale = await getRequestLocale();
  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    return (
      <SetupState
        title={getTranslation(locale, "products.setup.title")}
        description={getTranslation(locale, "products.setup.editDescription")}
        hint={getTranslation(locale, "products.setup.hint")}
        badgeLabel={getTranslation(locale, "navigation.badges.products")}
        ctaLabel={getTranslation(locale, "products.navigation.backToLibrary")}
      />
    );
  }

  const { productId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const product = await fetchProductWithAliases(productId);

  if (!product) {
    notFound();
  }

  const mode =
    resolvedSearchParams?.mode !== undefined
      ? parseProductLibraryMode(resolvedSearchParams.mode)
      : product.isArchived
        ? "archived"
        : "active";

  return (
    <ProductFormScreen
      mode="edit"
      initialValues={{
        displayName: product.displayName,
        aliases:
          product.aliases.length > 0
            ? product.aliases
            : [createEmptyAlias("alias-1")],
      }}
      saveAction={updateProductAction}
      productId={product.id}
      libraryMode={mode}
      isArchived={product.isArchived}
      archiveAction={archiveProductAction}
      restoreAction={restoreProductAction}
    />
  );
}
