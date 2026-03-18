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
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/85 p-3 shadow-sm">
      <div className="space-y-3">
        <div>
          <FieldLabel>Ingredient</FieldLabel>
          <TextInput
            name="ingredientName"
            value={ingredient.name}
            onChange={(value) => onChange({ ...ingredient, name: value })}
            placeholder="Tomatoes"
          />
        </div>

        <div className="grid grid-cols-[1fr_104px] gap-3">
          <div>
            <FieldLabel>Quantity</FieldLabel>
            <TextInput
              name="ingredientQuantity"
              value={ingredient.quantity}
              onChange={(value) => onChange({ ...ingredient, quantity: value })}
              placeholder="400"
            />
          </div>

          <div>
            <FieldLabel>Unit</FieldLabel>
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
          Remove row
        </button>
      </div>
    </div>
  );
}

function SubmitDishButton({ mode }: { mode: "add" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Saving..." : mode === "add" ? "Save dish" : "Save changes"}
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
  const [form, setForm] = useState(initialValues);
  const nextIngredientId = useRef(initialValues.ingredients.length + 1);

  const title = formMode === "add" ? "Add Dish" : "Edit Dish";
  const description =
    formMode === "add"
      ? "Create a family dish with the fields needed for MVP planning and shopping list generation."
      : "Adjust the dish details, notes, recipe text, and ingredients for the shared family dish database.";

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
          Back to Dish Library
        </Link>
        <span className="rounded-full bg-blush px-3 py-2 text-ink">
          {formMode === "add" ? "New dish" : "Edit mode"}
        </span>
      </div>

      <ScreenHeader eyebrow="Dish Form" title={title} description={description} />

      <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
        <div>
          <FieldLabel>Dish name</FieldLabel>
          <TextInput
            name="name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Tomato soup"
          />
        </div>

        <div>
          <FieldLabel>Category</FieldLabel>
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
                {getDishCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Comment</FieldLabel>
          <TextArea
            name="comment"
            value={form.comment}
            onChange={(value) => setForm((current) => ({ ...current, comment: value }))}
            placeholder="A short family note or serving reminder"
            minHeight="96px"
          />
        </div>

        <div>
          <FieldLabel>Recipe text</FieldLabel>
          <TextArea
            name="recipeText"
            value={form.recipeText}
            onChange={(value) => setForm((current) => ({ ...current, recipeText: value }))}
            placeholder="Write the simple preparation steps here"
            minHeight="140px"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Ingredients</p>
            <p className="mt-1 text-sm text-cocoa">
              Add only the MVP values needed for planning and shopping list generation.
            </p>
          </div>
          <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
            {form.ingredients.length} rows
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
          Add ingredient row
        </button>
      </SurfaceCard>

      <SurfaceCard className="space-y-3 bg-white/80">
        <p className="text-sm font-semibold text-ink">Form actions</p>
        <div className="grid grid-cols-2 gap-3">
          <SubmitDishButton mode={formMode} />
          <Link
            href={getDishLibraryHref(libraryMode)}
            className="rounded-2xl border border-clay/30 px-4 py-3 text-center text-sm font-semibold text-cocoa"
          >
            Cancel
          </Link>
        </div>
      </SurfaceCard>
    </form>
  );
}
