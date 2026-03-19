"use client";

import Link from "next/link";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatShoppingListCopy, getShoppingListCopy } from "@/lib/shopping-list-copy";
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
  errorMessage?: string;
  toggleCheckedAction: (formData: FormData) => Promise<void>;
  deleteItemAction: (formData: FormData) => Promise<void>;
};

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
  const sourceText = isManual ? copy.row.sourceManual : copy.row.sourceAuto;
  const toggleLabel = item.isChecked ? copy.row.bought : copy.row.markBought;
  const actionLabel = isManual ? copy.actions.removeItem : copy.actions.hideItem;

  return (
    <div
      className={[
        "rounded-[1.25rem] border px-3 py-3 shadow-sm transition",
        item.isChecked
          ? "border-leaf/20 bg-leaf/5"
          : "border-white/80 bg-white/92",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1 pt-0.5">
          <form action={toggleCheckedAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="nextChecked" value={String(!item.isChecked)} />
            <button
              type="submit"
              aria-label={toggleLabel}
              className={[
                "relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm transition",
                item.isChecked
                  ? "border-leaf bg-leaf text-white"
                  : "border-clay/35 bg-white text-cocoa hover:border-clay/55 hover:bg-cream",
              ].join(" ")}
            >
              {item.isChecked ? <CheckedIcon /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />}
            </button>
          </form>

          <span
            className={[
              "text-center text-[10px] font-semibold uppercase tracking-[0.14em]",
              item.isChecked ? "text-leaf" : "text-cocoa/72",
            ].join(" ")}
          >
            {toggleLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "break-words text-[15px] font-semibold leading-5 text-ink",
                  item.isChecked ? "line-through opacity-60" : "",
                ].join(" ")}
              >
                {item.ingredientName}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.isChecked ? "bg-white/75 text-cocoa/80" : "bg-sand/70 text-cocoa",
                  ].join(" ")}
                >
                  {item.quantity} {item.unit}
                </span>

                <p className="text-xs leading-5 text-cocoa/82">
                  <span className="font-semibold text-cocoa/72">{copy.row.sourceLabel}:</span>{" "}
                  {sourceText}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <Link
              href={`/products/${item.id}/edit`}
              className="text-cocoa transition hover:text-ink"
            >
              {copy.actions.editItem}
            </Link>

            <form action={deleteItemAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button
                type="submit"
                className="text-[#9b5353] transition hover:text-[#7d4040]"
              >
                {actionLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasMealPlan }: { hasMealPlan: boolean }) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);

  return (
    <SurfaceCard className="overflow-hidden bg-gradient-to-br from-white via-cream to-almond p-0">
      <div className="px-5 py-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-sm font-bold text-ink">
          PR
        </div>
        <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-ink">
          {copy.empty.title}
        </h2>
        <p className="mt-3 max-w-[34ch] text-sm leading-6 text-cocoa">
          {copy.empty.description}
        </p>
        <p className="mt-3 rounded-2xl bg-white/85 px-4 py-3 text-sm leading-6 text-cocoa">
          {copy.empty.manualHint}
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
            className="inline-flex justify-center rounded-2xl border border-clay/25 bg-white px-4 py-3 text-sm font-semibold text-cocoa"
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
  errorMessage,
  toggleCheckedAction,
  deleteItemAction,
}: ShoppingListScreenProps) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const items = snapshot?.items ?? [];
  const toBuyItems = items.filter((item) => !item.isChecked);
  const boughtItems = items.filter((item) => item.isChecked);
  const hasItems = items.length > 0;

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={copy.header.eyebrow}
        title={copy.header.title}
        description={copy.header.description}
      />

      <SurfaceCard className="bg-gradient-to-br from-white via-cream to-almond">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cocoa">{copy.weekCard.title}</p>
            <p className="mt-1 text-sm leading-6 text-cocoa">{copy.weekCard.description}</p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex shrink-0 rounded-[1.2rem] bg-clay px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            {copy.actions.addItem}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-white/85 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
              {copy.sections.toBuy}
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {formatShoppingListCopy(copy.summary.toBuy, { count: toBuyItems.length })}
            </p>
          </div>

          <div className="rounded-[1.2rem] bg-white/85 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
              {copy.sections.bought}
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {formatShoppingListCopy(copy.summary.bought, { count: boughtItems.length })}
            </p>
          </div>
        </div>
      </SurfaceCard>

      {errorMessage ? (
        <SurfaceCard className="border-clay/20 bg-white/90">
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

      {!errorMessage && !hasItems ? <EmptyState hasMealPlan={hasMealPlan} /> : null}

      {!errorMessage && hasItems ? (
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold text-ink">{copy.sections.toBuy}</p>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
                {toBuyItems.length}
              </span>
            </div>

            {toBuyItems.length > 0 ? (
              <div className="space-y-2">
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
              <SurfaceCard className="bg-white/75">
                <p className="text-sm leading-6 text-cocoa">{copy.empty.manualHint}</p>
              </SurfaceCard>
            )}
          </section>

          {boughtItems.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-sm font-semibold text-ink">{copy.sections.bought}</p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
                  {boughtItems.length}
                </span>
              </div>

              <div className="space-y-2">
                {boughtItems.map((item) => (
                  <ShoppingListRow
                    key={item.id}
                    item={item}
                    deleteItemAction={deleteItemAction}
                    toggleCheckedAction={toggleCheckedAction}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
