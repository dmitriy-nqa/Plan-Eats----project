"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";

import {
  countPillClassName,
  errorSurfaceClassName,
  inlineInfoClassName,
  sectionContentStackClassName,
  sectionHeaderButtonClassName,
  sectionHeaderTitleRowClassName,
  sectionSurfaceClassName,
  sectionSurfaceMutedClassName,
  secondaryActionClassName,
  stateSurfaceBadgeClassName,
  stateSurfaceBodyClassName,
  stateSurfaceClassName,
  stateSurfaceDescriptionClassName,
  stateSurfaceTitleClassName,
  topSurfaceClassName,
  topSurfaceDescriptionClassName,
  topSurfaceIntroClassName,
  topSurfaceStackClassName,
  topSurfaceSupportingTextClassName,
} from "@/components/ui/presentation";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getShoppingFlowState,
  getShoppingListCopy,
} from "@/lib/shopping-list-copy";
import { useLocale } from "@/lib/i18n/provider";

type ShoppingListItemView = {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  sourceType: "auto" | "manual";
  isChecked: boolean;
};

type ShoppingListSnapshotView = {
  items: ShoppingListItemView[];
};

type ShoppingListScreenProps = {
  hasMealPlan: boolean;
  snapshot: ShoppingListSnapshotView | null;
  isSyncPending?: boolean;
  errorMessage?: string;
  toggleCheckedAction: (formData: FormData) => Promise<void>;
  deleteItemAction: (formData: FormData) => Promise<void>;
};

type ShoppingListSectionKey = "toBuy" | "bought";

function getDefaultCollapsedSections(): Partial<
  Record<ShoppingListSectionKey, boolean>
> {
  return {
    toBuy: false,
    bought: true,
  };
}

function getCollapsedSectionsStorageKey() {
  return "shopping-list:collapsed-sections";
}

function readCollapsedSections(): Partial<Record<ShoppingListSectionKey, boolean>> {
  const defaultValue = getDefaultCollapsedSections();

  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const rawValue = window.localStorage.getItem(getCollapsedSectionsStorageKey());

    if (!rawValue) {
      return defaultValue;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return defaultValue;
    }

    const nextValue: Partial<Record<ShoppingListSectionKey, boolean>> = {
      ...defaultValue,
    };

    if (typeof parsedValue.toBuy === "boolean") {
      nextValue.toBuy = parsedValue.toBuy;
    }

    if (typeof parsedValue.bought === "boolean") {
      nextValue.bought = parsedValue.bought;
    }

    return nextValue;
  } catch {
    return defaultValue;
  }
}

function writeCollapsedSections(value: Partial<Record<ShoppingListSectionKey, boolean>>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getCollapsedSectionsStorageKey(),
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage write failures and keep the UI responsive.
  }
}

function CheckedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function SectionToggle({
  label,
  count,
  isExpanded,
  onToggle,
  tone = "primary",
}: {
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  tone?: "primary" | "secondary";
}) {
  const countLabelClass =
    tone === "secondary"
      ? `${countPillClassName} bg-white/72 text-cocoa/72 shadow-none`
      : countPillClassName;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        `${sectionHeaderButtonClassName} py-2`,
        tone === "secondary" ? "text-cocoa hover:bg-white/40" : "hover:bg-white/42",
      ].join(" ")}
      aria-expanded={isExpanded}
    >
      <div className={sectionHeaderTitleRowClassName}>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <span className={countLabelClass}>{count}</span>
      </div>

      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-cocoa shadow-sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={[
            "h-4 w-4 transition",
            isExpanded ? "rotate-90" : "rotate-0",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4.5 9.5 8 6 11.5" />
        </svg>
      </span>
    </button>
  );
}

function ShoppingListRow({
  item,
  deleteItemAction,
  toggleCheckedAction,
}: {
  item: ShoppingListItemView;
  deleteItemAction: (formData: FormData) => Promise<void>;
  toggleCheckedAction: (formData: FormData) => Promise<void>;
}) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const isManual = item.sourceType === "manual";
  const toggleLabel = item.isChecked ? copy.row.bought : copy.row.markBought;
  const actionLabel = isManual ? copy.actions.removeItem : copy.actions.hideItem;
  const actionClassName =
    "inline-flex min-h-7 items-center rounded-full px-2 py-0.5 text-[12px] font-medium leading-5 transition";

  function confirmRemoveFromList(event: React.FormEvent<HTMLFormElement>) {
    if (isManual) {
      return;
    }

    const shouldRemove = window.confirm(copy.actions.confirmHideItem);

    if (!shouldRemove) {
      event.preventDefault();
    }
  }

  return (
    <div
      className={[
        "rounded-[1.15rem] border px-3 py-2 shadow-sm transition",
        item.isChecked
          ? "border-white/70 bg-white/72"
          : "border-white/80 bg-white/92",
      ].join(" ")}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex w-10 shrink-0 items-start justify-center pt-0.5">
          <form action={toggleCheckedAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="nextChecked" value={String(!item.isChecked)} />
            <button
              type="submit"
              aria-label={toggleLabel}
              className={[
                "relative flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm transition",
                item.isChecked
                  ? "border-leaf bg-leaf text-white"
                  : "border-clay/35 bg-white text-cocoa hover:border-clay/55 hover:bg-cream",
              ].join(" ")}
            >
              {item.isChecked ? <CheckedIcon /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />}
            </button>
          </form>
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p
              className={[
                "break-words text-[15px] font-semibold leading-5 text-ink",
                item.isChecked ? "text-cocoa" : "",
              ].join(" ")}
            >
              {item.ingredientName}
            </p>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
                  item.isChecked ? "bg-white/84 text-cocoa" : "bg-sand/68 text-cocoa",
                ].join(" ")}
              >
                {item.quantity} {item.unit}
              </span>

              <div className="flex flex-wrap items-center justify-end gap-1">
                <Link
                  href={`/products/${item.id}/edit`}
                  prefetch={false}
                  className={`${actionClassName} text-cocoa/80 hover:bg-white/76 hover:text-ink`}
                >
                  {copy.actions.editItem}
                </Link>

                <form action={deleteItemAction} onSubmit={confirmRemoveFromList}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    className={`${actionClassName} text-[#9b5353]/90 hover:bg-white/76 hover:text-[#7d4040]`}
                  >
                    {actionLabel}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  hasMealPlan,
  isSyncPending = false,
}: {
  hasMealPlan: boolean;
  isSyncPending?: boolean;
}) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const title = isSyncPending ? copy.pending.title : copy.empty.title;
  const description = isSyncPending ? copy.pending.description : copy.empty.description;
  const helperText = isSyncPending ? copy.pending.manualHint : copy.empty.manualHint;

  return (
    <SurfaceCard className={stateSurfaceClassName}>
      <div className={stateSurfaceBodyClassName}>
        <div className={stateSurfaceBadgeClassName}>
          PR
        </div>
        <h2 className={stateSurfaceTitleClassName}>
          {title}
        </h2>
        <p className={stateSurfaceDescriptionClassName}>
          {description}
        </p>
        <p className={`mt-4 ${inlineInfoClassName}`}>
          {helperText}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products/new"
            className="inline-flex justify-center rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {copy.actions.addItem}
          </Link>
          <Link
            href="/"
            className={secondaryActionClassName}
          >
            {copy.actions.backToWeeklyMenu}
          </Link>
        </div>
        {!hasMealPlan ? (
          <p className="mt-4 text-sm leading-6 text-cocoa">
            {copy.weekCard.description}
          </p>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function ShoppingListScreen({
  hasMealPlan,
  snapshot,
  isSyncPending = false,
  errorMessage,
  toggleCheckedAction,
  deleteItemAction,
}: ShoppingListScreenProps) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const [collapsedSections, setCollapsedSections] = useState<
    Partial<Record<ShoppingListSectionKey, boolean>>
  >(getDefaultCollapsedSections);
  const [hasLoadedCollapsedSections, setHasLoadedCollapsedSections] = useState(false);
  const items = snapshot?.items ?? [];
  const toBuyItems = items.filter((item) => !item.isChecked);
  const boughtItems = items.filter((item) => item.isChecked);
  const hasItems = items.length > 0;
  const isToBuyExpanded = !collapsedSections.toBuy;
  const isBoughtExpanded = !collapsedSections.bought;
  const flowState = getShoppingFlowState({
    hasMealPlan,
    isSyncPending,
    totalItems: items.length,
    toBuyCount: toBuyItems.length,
    boughtCount: boughtItems.length,
  });
  const toBuySummaryClass =
    flowState === "complete"
      ? "bg-white/78"
      : toBuyItems.length > 0
        ? "border border-blush/18 bg-blush/22"
        : "bg-white/82";
  const boughtSummaryClass =
    flowState === "complete"
      ? "border border-leaf/16 bg-leaf/8"
      : boughtItems.length > 0
        ? "border border-leaf/10 bg-white/88"
        : "bg-white/82";
  const toBuyValueClass =
    flowState === "complete" ? "text-cocoa" : toBuyItems.length > 0 ? "text-ink" : "text-cocoa";
  const boughtValueClass =
    flowState === "complete"
      ? "text-leaf"
      : boughtItems.length > 0
        ? "text-ink"
        : "text-cocoa";

  useLayoutEffect(() => {
    setCollapsedSections(readCollapsedSections());
    setHasLoadedCollapsedSections(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCollapsedSections) {
      return;
    }

    writeCollapsedSections(collapsedSections);
  }, [collapsedSections, hasLoadedCollapsedSections]);

  function toggleSection(section: ShoppingListSectionKey) {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={copy.header.eyebrow}
        title={copy.header.title}
        description={copy.header.description}
      />

      <SurfaceCard className={`${topSurfaceClassName} p-5`}>
        <div className={topSurfaceStackClassName}>
          <div className="space-y-4">
            <div className={topSurfaceIntroClassName}>
              <p className="text-sm font-semibold text-cocoa">{copy.weekCard.title}</p>
              <p className={topSurfaceDescriptionClassName}>
                {copy.flow.productsTop.stateDescriptions[flowState]}
              </p>
              <p className={topSurfaceSupportingTextClassName}>
                {copy.flow.productsTop.supporting}
              </p>
            </div>

            <Link
              href="/products/new"
              className="inline-flex self-start rounded-[1.2rem] bg-clay px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              {copy.actions.addItem}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className={`rounded-[1rem] px-3 py-2.5 ${toBuySummaryClass}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/80">
                {copy.sections.toBuy}
              </p>
              <p className={`mt-1 text-sm font-semibold ${toBuyValueClass}`}>
                {toBuyItems.length}
              </p>
            </div>

            <div className={`rounded-[1rem] px-3 py-2.5 ${boughtSummaryClass}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cocoa/80">
                {copy.sections.bought}
              </p>
              <p className={`mt-1 text-sm font-semibold ${boughtValueClass}`}>
                {boughtItems.length}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {errorMessage ? (
        <SurfaceCard className={errorSurfaceClassName}>
          <p className="text-sm font-semibold text-ink">{copy.error.title}</p>
          <p className="mt-2 text-sm leading-6 text-cocoa">{errorMessage || copy.error.description}</p>
          <Link
            href="/products"
            className="mt-4 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {copy.actions.retry}
          </Link>
        </SurfaceCard>
      ) : null}

      {!errorMessage && !hasItems ? (
        <EmptyState hasMealPlan={hasMealPlan} isSyncPending={isSyncPending} />
      ) : null}

      {!errorMessage && hasItems ? (
        <div className="space-y-5">
          <SurfaceCard className={sectionSurfaceClassName}>
            <SectionToggle
              label={copy.sections.toBuy}
              count={toBuyItems.length}
              isExpanded={isToBuyExpanded}
              onToggle={() => toggleSection("toBuy")}
            />

            {isToBuyExpanded ? (
              toBuyItems.length > 0 ? (
                <div className={sectionContentStackClassName}>
                  {toBuyItems.map((item) => (
                    <ShoppingListRow
                      key={item.id}
                      item={item}
                      deleteItemAction={deleteItemAction}
                      toggleCheckedAction={toggleCheckedAction}
                    />
                  ))}
                </div>
              ) : (
                <SurfaceCard
                  className={
                    flowState === "complete" ? "border-leaf/15 bg-leaf/8" : "bg-white/75"
                  }
                >
                  <p className="text-sm leading-6 text-cocoa">
                    {flowState === "complete" ? copy.flow.completeNote : copy.empty.manualHint}
                  </p>
                </SurfaceCard>
              )
            ) : null}
          </SurfaceCard>

          {boughtItems.length > 0 ? (
            <SurfaceCard className={sectionSurfaceMutedClassName}>
              <SectionToggle
                label={copy.sections.bought}
                count={boughtItems.length}
                isExpanded={isBoughtExpanded}
                onToggle={() => toggleSection("bought")}
                tone="secondary"
              />

              {isBoughtExpanded ? (
                <div className={sectionContentStackClassName}>
                  {boughtItems.map((item) => (
                    <ShoppingListRow
                      key={item.id}
                      item={item}
                      deleteItemAction={deleteItemAction}
                      toggleCheckedAction={toggleCheckedAction}
                    />
                  ))}
                </div>
              ) : null}
            </SurfaceCard>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
