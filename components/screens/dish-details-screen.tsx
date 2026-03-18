"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { DishDetails } from "@/lib/dish-crud";
import { useLocale, useT } from "@/lib/i18n/provider";
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

function IngredientsList({
  ingredients,
  emptyText,
}: {
  ingredients: DishDetails["ingredients"];
  emptyText: string;
}) {
  if (ingredients.length === 0) {
    return <p>{emptyText}</p>;
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
    const match = line.match(/^((\d+[\).\:-]?)|[-*\u2022])\s+(.*)$/);

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

function RecipeContent({
  recipeText,
  emptyText,
}: {
  recipeText: string;
  emptyText: string;
}) {
  const normalizedText = recipeText.trim();

  if (!normalizedText) {
    return <p>{emptyText}</p>;
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

function NotesContent({ notes, emptyText }: { notes: string; emptyText: string }) {
  const normalizedNotes = notes.trim();

  if (!normalizedNotes) {
    return <p>{emptyText}</p>;
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
  const t = useT();
  const editHref = `/dishes/${dishId}/edit?mode=${mode}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href={editHref}
        className="rounded-2xl bg-clay px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
      >
        {t("common.actions.edit")}
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
          {isArchived ? t("common.actions.restore") : t("common.actions.archive")}
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
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <Link
          href={getDishLibraryHref(mode)}
          className="rounded-full bg-white/90 px-3 py-2 shadow-sm"
        >
          {t("dishes.navigation.backToLibrary")}
        </Link>
      </div>

      <ScreenHeader
        eyebrow={t("dishes.details.header.eyebrow")}
        title={dish.name}
        description={
          dish.isArchived
            ? t("dishes.details.header.archivedDescription")
            : t("dishes.details.header.activeDescription")
        }
      />

      <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <MetadataBadge>{getDishCategoryLabel(dish.category, locale)}</MetadataBadge>
              {dish.isArchived ? (
                <MetadataBadge>{t("dishes.details.archivedBadge")}</MetadataBadge>
              ) : null}
            </div>
          </div>
        </div>

        {dish.isArchived ? (
          <div className="rounded-[1.25rem] border border-leaf/15 bg-white/70 px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              {t("dishes.details.archivedNotice.title")}
            </p>
            <p className="mt-1 text-sm leading-6 text-cocoa">
              {t("dishes.details.archivedNotice.description")}
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

      <Section title={t("dishes.details.sections.ingredients")}>
        <IngredientsList
          ingredients={dish.ingredients}
          emptyText={t("dishes.details.empty.ingredients")}
        />
      </Section>

      <Section title={t("dishes.details.sections.cookingSteps")}>
        <RecipeContent
          recipeText={dish.recipeText}
          emptyText={t("dishes.details.empty.cookingSteps")}
        />
      </Section>

      <Section title={t("dishes.details.sections.notes")}>
        <NotesContent
          notes={dish.comment}
          emptyText={t("dishes.details.empty.notes")}
        />
      </Section>
    </div>
  );
}
