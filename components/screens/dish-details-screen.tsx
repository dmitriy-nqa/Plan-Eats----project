"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { DishDetails } from "@/lib/dish-crud";
import {
  getDishCategoryLabel,
  getDishLibraryHref,
  type DishLibraryMode,
} from "@/lib/dishes";

function MetadataBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SurfaceCard className="bg-white/85">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="mt-3 text-sm leading-6 text-cocoa">{children}</div>
    </SurfaceCard>
  );
}

function IngredientsList({ ingredients }: { ingredients: DishDetails["ingredients"] }) {
  if (ingredients.length === 0) {
    return <p>No ingredients were added for this dish yet.</p>;
  }

  return (
    <div className="divide-y divide-sand/70">
      {ingredients.map((ingredient) => (
        <div
          key={ingredient.id}
          className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <p className="min-w-0 break-words pr-3 font-semibold text-ink">
            {ingredient.name}
          </p>
          <span className="shrink-0 font-semibold text-cocoa">
            {ingredient.quantity} {ingredient.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function normalizeRecipeLines(recipeText: string) {
  return recipeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getStructuredRecipeSteps(recipeText: string) {
  const lines = normalizeRecipeLines(recipeText);

  if (lines.length < 2) {
    return null;
  }

  const markedLines = lines.map((line) => {
    const match = line.match(/^((\d+[\).\:-]?)|[-*•])\s+(.*)$/);

    if (!match) {
      return null;
    }

    return match[3].trim();
  });

  if (markedLines.some((line) => !line)) {
    return null;
  }

  return markedLines as string[];
}

function RecipeContent({ recipeText }: { recipeText: string }) {
  const normalizedText = recipeText.trim();

  if (!normalizedText) {
    return <p>No cooking steps were added for this dish yet.</p>;
  }

  const structuredSteps = getStructuredRecipeSteps(normalizedText);

  if (!structuredSteps) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-cocoa">
        {normalizedText}
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {structuredSteps.map((step, index) => (
        <li
          key={`${index + 1}-${step}`}
          className="flex items-start gap-3 border-b border-sand/70 py-2 last:border-b-0 last:pb-0 first:pt-0"
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand/70 text-[11px] font-semibold text-cocoa">
            {index + 1}
          </span>
          <p className="min-w-0 break-words pt-0.5 text-sm leading-6 text-cocoa">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

function NotesContent({ notes }: { notes: string }) {
  const normalizedNotes = notes.trim();

  if (!normalizedNotes) {
    return <p>No notes were added for this dish yet.</p>;
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-cocoa">
      {normalizedNotes}
    </p>
  );
}

function DishPrimaryActions({
  dishId,
  isArchived,
  mode,
  archiveAction,
  restoreAction,
}: {
  dishId: string;
  isArchived: boolean;
  mode: DishLibraryMode;
  archiveAction: (formData: FormData) => Promise<void>;
  restoreAction: (formData: FormData) => Promise<void>;
}) {
  const editHref = `/dishes/${dishId}/edit?mode=${mode}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href={editHref}
        className="rounded-2xl bg-clay px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
      >
        Edit
      </Link>

      <form action={isArchived ? restoreAction : archiveAction}>
        <input type="hidden" name="dishId" value={dishId} />
        <button
          type="submit"
          className={[
            "w-full rounded-2xl border px-4 py-3 text-sm font-semibold",
            isArchived
              ? "border-leaf/30 bg-leaf/10 text-leaf"
              : "border-clay/25 bg-white/80 text-clay",
          ].join(" ")}
        >
          {isArchived ? "Restore" : "Archive"}
        </button>
      </form>
    </div>
  );
}

export function DishDetailsScreen({
  dish,
  mode,
  archiveAction,
  restoreAction,
}: {
  dish: DishDetails;
  mode: DishLibraryMode;
  archiveAction: (formData: FormData) => Promise<void>;
  restoreAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <Link
          href={getDishLibraryHref(mode)}
          className="rounded-full bg-white/90 px-3 py-2 shadow-sm"
        >
          Back to Dish Library
        </Link>
      </div>

      <ScreenHeader
        eyebrow="Dish Details"
        title={dish.name}
        description={
          dish.isArchived
            ? "This dish lives in Archived for now. You can still read it, edit it, and restore it when it belongs back in the active family library."
            : "A calm reading view for the family dish, so cooking details stay easy to revisit before editing."
        }
      />

      <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <MetadataBadge>{getDishCategoryLabel(dish.category)}</MetadataBadge>
              {dish.isArchived ? <MetadataBadge>Archived dish</MetadataBadge> : null}
            </div>
          </div>
        </div>

        {dish.isArchived ? (
          <div className="rounded-[1.25rem] border border-leaf/15 bg-white/70 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Archived dishes stay safe here</p>
            <p className="mt-1 text-sm leading-6 text-cocoa">
              Restoring this dish will place it back in the Active Dish Library.
            </p>
          </div>
        ) : null}

        <DishPrimaryActions
          dishId={dish.id}
          isArchived={dish.isArchived}
          mode={mode}
          archiveAction={archiveAction}
          restoreAction={restoreAction}
        />
      </SurfaceCard>

      <Section title="Ingredients">
        <IngredientsList ingredients={dish.ingredients} />
      </Section>

      <Section title="Cooking steps">
        <RecipeContent recipeText={dish.recipeText} />
      </Section>

      <Section title="Notes">
        <NotesContent notes={dish.comment} />
      </Section>
    </div>
  );
}
