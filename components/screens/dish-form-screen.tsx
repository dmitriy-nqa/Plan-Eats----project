"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createEmptyIngredient,
  dishCategories,
  ingredientUnits,
  type DishFormValues,
  type DishIngredientDraft,
} from "@/lib/dish-form";
import { useLocale, useT } from "@/lib/i18n/provider";
import { getDishCategoryLabel, getDishLibraryHref, type DishLibraryMode } from "@/lib/dishes";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
      {children}
    </span>
  );
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-cocoa/55"
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight: string;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-cocoa/55"
      style={{ minHeight }}
    />
  );
}

function IngredientRow({
  ingredient,
  onChange,
  onRemove,
  canRemove,
}: {
  ingredient: DishIngredientDraft;
  onChange: (ingredient: DishIngredientDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const t = useT();

  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/85 p-3 shadow-sm">
      <div className="space-y-3">
        <div>
          <FieldLabel>{t("dishes.form.fields.ingredient")}</FieldLabel>
          <TextInput
            name="ingredientName"
            value={ingredient.name}
            onChange={(value) => onChange({ ...ingredient, name: value })}
            placeholder={t("dishes.form.placeholders.ingredient")}
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
              className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm text-ink outline-none"
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
}: {
  mode: "add" | "edit";
  initialValues: DishFormValues;
  saveAction: (formData: FormData) => Promise<void>;
  dishId?: string;
  libraryMode?: DishLibraryMode;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [form, setForm] = useState(initialValues);
  const nextIngredientId = useRef(initialValues.ingredients.length + 1);

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
    <form action={saveAction} className="space-y-4">
      {dishId ? <input type="hidden" name="dishId" value={dishId} /> : null}
      <input type="hidden" name="mode" value={libraryMode} />

      <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <Link
          href={getDishLibraryHref(libraryMode)}
          className="rounded-full bg-white/90 px-3 py-2 shadow-sm"
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
          />
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
          <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
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
        <div className="grid grid-cols-2 gap-3">
          <SubmitDishButton mode={formMode} />
          <Link
            href={getDishLibraryHref(libraryMode)}
            className="rounded-2xl border border-clay/30 px-4 py-3 text-center text-sm font-semibold text-cocoa"
          >
            {t("common.actions.cancel")}
          </Link>
        </div>
      </SurfaceCard>
    </form>
  );
}
