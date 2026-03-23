"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  backActionClassName,
  countPillClassName,
  secondaryActionClassName,
} from "@/components/ui/presentation";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createEmptyIngredient,
  dishCategories,
  ingredientUnits,
  initialDishFormSubmissionState,
  type DishFormSubmissionState,
  type DishFormValues,
  type DishIngredientDraft,
} from "@/lib/dish-form";
import { getDishCategoryLabel, getDishLibraryHref, type DishLibraryMode } from "@/lib/dishes";
import { useLocale, useT } from "@/lib/i18n/provider";
import {
  getProductDictionaryEditHref,
  type ProductSuggestion,
} from "@/lib/products";
import { getNormalizedProductKeys } from "@/lib/products-normalization";

type ProductMatch = {
  product: ProductSuggestion;
  matchType: "canonical" | "alias" | "token" | "partial";
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
      {children}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm leading-5 text-[#b04b4b]">{message}</p>;
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
  required = false,
  hasError = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  hasError?: boolean;
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      aria-invalid={hasError || undefined}
      className={[
        "w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-cocoa/55",
        hasError ? "border border-[#d38c8c]" : "border border-white/80",
      ].join(" ")}
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
  minHeight,
  hasError = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight: string;
  hasError?: boolean;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-invalid={hasError || undefined}
      className={[
        "w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-cocoa/55",
        hasError ? "border border-[#d38c8c]" : "border border-white/80",
      ].join(" ")}
      style={{ minHeight }}
    />
  );
}

function matchScore(matchType: ProductMatch["matchType"]) {
  switch (matchType) {
    case "canonical":
      return 4;
    case "alias":
      return 3;
    case "token":
      return 2;
    default:
      return 1;
  }
}

function findProductMatches(
  query: string,
  productSuggestions: ProductSuggestion[],
  currentProductId: string | null,
) {
  const { normalizedName, tokenKey } = getNormalizedProductKeys(query);

  if (!normalizedName) {
    return {
      activeMatches: [] as ProductMatch[],
      archivedMatch: undefined as ProductMatch | undefined,
    };
  }

  const matches = productSuggestions.flatMap((product) => {
    const canonicalExact = product.normalizedName === normalizedName;
    const aliasExact = product.aliasNormalizedNames.includes(normalizedName);
    const tokenMatch = tokenKey.length > 0
      && (product.tokenKey === tokenKey || product.aliasTokenKeys.includes(tokenKey));
    const partialMatch = normalizedName.length > 1
      && (
        product.normalizedName.includes(normalizedName)
        || product.aliasNormalizedNames.some((alias) => alias.includes(normalizedName))
      );

    if (!canonicalExact && !aliasExact && !tokenMatch && !partialMatch) {
      return [];
    }

    const matchType: ProductMatch["matchType"] = canonicalExact
      ? "canonical"
      : aliasExact
        ? "alias"
        : tokenMatch
          ? "token"
          : "partial";

    return [{ product, matchType }];
  });

  const sortedMatches = matches.sort((left, right) => {
    return matchScore(right.matchType) - matchScore(left.matchType);
  });
  const activeMatches = sortedMatches
    .filter((match) => !match.product.isArchived && match.product.id !== currentProductId)
    .slice(0, 3);
  const archivedMatch = sortedMatches.find(
    (match) => match.product.isArchived && match.product.id !== currentProductId,
  );

  return {
    activeMatches,
    archivedMatch,
  };
}

function ProductLinkBadge({
  ingredient,
  onUnlink,
}: {
  ingredient: DishIngredientDraft;
  onUnlink: () => void;
}) {
  const t = useT();

  if (!ingredient.productId) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
        {t("dishes.form.productLink.linkedTo", {
          name: ingredient.linkedProductName ?? ingredient.name,
        })}
      </span>
      {ingredient.linkedProductIsArchived ? (
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-semibold text-leaf">
          {t("dishes.form.productLink.archived")}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onUnlink}
        className="rounded-full border border-clay/30 px-3 py-1 text-xs font-semibold text-clay"
      >
        {t("dishes.form.productLink.unlink")}
      </button>
    </div>
  );
}

function ProductSuggestionsBlock({
  ingredient,
  productSuggestions,
  onUseProduct,
}: {
  ingredient: DishIngredientDraft;
  productSuggestions: ProductSuggestion[];
  onUseProduct: (product: ProductSuggestion) => void;
}) {
  const t = useT();
  const { activeMatches, archivedMatch } = findProductMatches(
    ingredient.name,
    productSuggestions,
    ingredient.productId,
  );

  if (activeMatches.length === 0 && !archivedMatch) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {activeMatches.length > 0 ? (
        <div className="rounded-[1.1rem] bg-sand/55 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
            {t("dishes.form.productLink.suggestionsTitle")}
          </p>
          <div className="mt-2 space-y-2">
            {activeMatches.map((match) => (
              <div
                key={`${match.product.id}-${match.matchType}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {match.product.displayName}
                  </p>
                  <p className="text-xs text-cocoa">
                    {match.matchType === "alias"
                      ? t("dishes.form.productLink.matchAlias")
                      : match.matchType === "token"
                        ? t("dishes.form.productLink.matchToken")
                        : match.matchType === "partial"
                          ? t("dishes.form.productLink.matchPartial")
                          : t("dishes.form.productLink.matchCanonical")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseProduct(match.product)}
                  className="rounded-full bg-clay px-3 py-2 text-xs font-semibold text-white"
                >
                  {ingredient.productId
                    ? t("dishes.form.productLink.relink")
                    : t("dishes.form.productLink.useProduct")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {archivedMatch ? (
        <div className="rounded-[1.1rem] border border-leaf/15 bg-white/75 px-3 py-3">
          <p className="text-sm leading-6 text-cocoa">
            {t("dishes.form.productLink.archivedMatch", {
              name: archivedMatch.product.displayName,
            })}
          </p>
          <Link
            href={getProductDictionaryEditHref(archivedMatch.product.id, "archived")}
            className="mt-3 inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-cocoa shadow-sm"
          >
            {t("dishes.form.productLink.openArchived")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function IngredientRow({
  ingredient,
  onChange,
  onRemove,
  canRemove,
  errorMessage,
  productSuggestions,
}: {
  ingredient: DishIngredientDraft;
  onChange: (ingredient: DishIngredientDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
  errorMessage?: string;
  productSuggestions: ProductSuggestion[];
}) {
  const t = useT();

  function handleUseProduct(product: ProductSuggestion) {
    onChange({
      ...ingredient,
      productId: product.id,
      linkedProductName: product.displayName,
      linkedProductIsArchived: product.isArchived,
      name: ingredient.name || product.displayName,
    });
  }

  function handleUnlink() {
    onChange({
      ...ingredient,
      productId: null,
      linkedProductName: undefined,
      linkedProductIsArchived: undefined,
    });
  }

  return (
    <div
      className={[
        "rounded-[1.5rem] bg-white/85 p-3 shadow-sm",
        errorMessage ? "border border-[#d38c8c]" : "border border-white/80",
      ].join(" ")}
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>{t("dishes.form.fields.ingredient")}</FieldLabel>
          <TextInput
            name="ingredientName"
            value={ingredient.name}
            onChange={(value) => onChange({ ...ingredient, name: value })}
            placeholder={t("dishes.form.placeholders.ingredient")}
            hasError={Boolean(errorMessage)}
          />
          <input type="hidden" name="ingredientProductId" value={ingredient.productId ?? ""} />
          <ProductLinkBadge ingredient={ingredient} onUnlink={handleUnlink} />
          <ProductSuggestionsBlock
            ingredient={ingredient}
            productSuggestions={productSuggestions}
            onUseProduct={handleUseProduct}
          />
        </div>

        <div className="grid grid-cols-[1fr_104px] gap-3">
          <div>
            <FieldLabel>{t("dishes.form.fields.quantity")}</FieldLabel>
            <TextInput
              name="ingredientQuantity"
              value={ingredient.quantity}
              onChange={(value) => onChange({ ...ingredient, quantity: value })}
              placeholder="400"
              hasError={Boolean(errorMessage)}
            />
          </div>

          <div>
            <FieldLabel>{t("dishes.form.fields.unit")}</FieldLabel>
            <select
              name="ingredientUnit"
              value={ingredient.unit}
              onChange={(event) =>
                onChange({
                  ...ingredient,
                  unit: event.target.value as DishIngredientDraft["unit"],
                })
              }
              aria-invalid={Boolean(errorMessage) || undefined}
              className={[
                "w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink outline-none",
                errorMessage ? "border border-[#d38c8c]" : "border border-white/80",
              ].join(" ")}
            >
              {ingredientUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-full border border-clay/30 px-3 py-2 text-xs font-semibold text-clay disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("dishes.form.ingredients.removeRow")}
        </button>
      </div>

      <FieldError message={errorMessage} />
    </div>
  );
}

function SubmitDishButton({ mode }: { mode: "add" | "edit" }) {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending
        ? t("dishes.form.actions.saving")
        : mode === "add"
          ? t("dishes.form.actions.saveDish")
          : t("dishes.form.actions.saveChanges")}
    </button>
  );
}

export function DishFormScreen({
  mode: formMode,
  initialValues,
  saveAction,
  dishId,
  libraryMode = "active",
  productSuggestions,
}: {
  mode: "add" | "edit";
  initialValues: DishFormValues;
  saveAction: (
    state: DishFormSubmissionState,
    formData: FormData,
  ) => Promise<DishFormSubmissionState>;
  dishId?: string;
  libraryMode?: DishLibraryMode;
  productSuggestions: ProductSuggestion[];
}) {
  const t = useT();
  const { locale } = useLocale();
  const [form, setForm] = useState(initialValues);
  const nextIngredientId = useRef(initialValues.ingredients.length + 1);
  const [submissionState, submitAction] = useActionState(
    saveAction,
    initialDishFormSubmissionState,
  );

  const title =
    formMode === "add"
      ? t("dishes.form.header.createTitle")
      : t("dishes.form.header.editTitle");
  const description =
    formMode === "add"
      ? t("dishes.form.header.createDescription")
      : t("dishes.form.header.editDescription");

  function updateIngredient(index: number, ingredient: DishIngredientDraft) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? ingredient : item,
      ),
    }));
  }

  function addIngredientRow() {
    const newIngredient = createEmptyIngredient(`ingredient-${nextIngredientId.current}`);
    nextIngredientId.current += 1;

    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, newIngredient],
    }));
  }

  function removeIngredientRow(index: number) {
    setForm((current) => {
      if (current.ingredients.length === 1) {
        return {
          ...current,
          ingredients: [createEmptyIngredient(current.ingredients[0].id)],
        };
      }

      return {
        ...current,
        ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  return (
    <form action={submitAction} className="space-y-4">
      {dishId ? <input type="hidden" name="dishId" value={dishId} /> : null}
      <input type="hidden" name="mode" value={libraryMode} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <Link
          href={getDishLibraryHref(libraryMode)}
          className={backActionClassName}
        >
          {t("dishes.navigation.backToLibrary")}
        </Link>
        <span className="rounded-full bg-blush px-3 py-2 text-ink">
          {formMode === "add"
            ? t("dishes.form.badges.newDish")
            : t("dishes.form.badges.editMode")}
        </span>
      </div>

      <ScreenHeader
        eyebrow={t("dishes.form.header.eyebrow")}
        title={title}
        description={description}
      />

      <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
        <div>
          <FieldLabel>{t("dishes.form.fields.dishName")}</FieldLabel>
          <TextInput
            name="name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder={t("dishes.form.placeholders.dishName")}
            required
            hasError={Boolean(submissionState.fieldErrors.name)}
          />
          <FieldError message={submissionState.fieldErrors.name} />
        </div>

        <div>
          <FieldLabel>{t("dishes.form.fields.category")}</FieldLabel>
          <select
            name="category"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as DishFormValues["category"],
              }))
            }
            className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm text-ink outline-none"
          >
            {dishCategories.map((category) => (
              <option key={category} value={category}>
                {getDishCategoryLabel(category, locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>{t("dishes.form.fields.comment")}</FieldLabel>
          <TextArea
            name="comment"
            value={form.comment}
            onChange={(value) => setForm((current) => ({ ...current, comment: value }))}
            placeholder={t("dishes.form.placeholders.comment")}
            minHeight="96px"
          />
        </div>

        <div>
          <FieldLabel>{t("dishes.form.fields.recipeText")}</FieldLabel>
          <TextArea
            name="recipeText"
            value={form.recipeText}
            onChange={(value) => setForm((current) => ({ ...current, recipeText: value }))}
            placeholder={t("dishes.form.placeholders.recipeText")}
            minHeight="140px"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {t("dishes.form.ingredients.title")}
            </p>
            <p className="mt-1 text-sm text-cocoa">
              {t("dishes.form.ingredients.description")}
            </p>
          </div>
          <span className={countPillClassName}>
            {t("dishes.form.ingredients.rowsCount", { count: form.ingredients.length })}
          </span>
        </div>

        <div className="space-y-3">
          {form.ingredients.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              onChange={(value) => updateIngredient(index, value)}
              onRemove={() => removeIngredientRow(index)}
              canRemove={form.ingredients.length > 1}
              errorMessage={submissionState.fieldErrors.ingredientRows[index]}
              productSuggestions={productSuggestions}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredientRow}
          className="w-full rounded-2xl border border-dashed border-clay/40 bg-white px-4 py-3 text-sm font-semibold text-cocoa"
        >
          {t("dishes.form.ingredients.addRow")}
        </button>
      </SurfaceCard>

      <SurfaceCard className="space-y-3 bg-white/80">
        <p className="text-sm font-semibold text-ink">{t("dishes.form.actions.title")}</p>
        <FieldError message={submissionState.formError} />
        <div className="grid grid-cols-2 gap-3">
          <SubmitDishButton mode={formMode} />
          <Link
            href={getDishLibraryHref(libraryMode)}
            className={secondaryActionClassName}
          >
            {t("common.actions.cancel")}
          </Link>
        </div>
      </SurfaceCard>
    </form>
  );
}
