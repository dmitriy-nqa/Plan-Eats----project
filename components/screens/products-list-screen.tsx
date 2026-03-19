"use client";

import Link from "next/link";
import { useState } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useT } from "@/lib/i18n/provider";
import {
  getProductDictionaryCreateHref,
  getProductDictionaryEditHref,
  getProductLibraryHref,
  type ProductLibraryMode,
  type ProductSummary,
} from "@/lib/products";

function SearchField({
  value,
  onChange,
  label,
  placeholder,
  badgeLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  badgeLabel: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/80 bg-white/92 px-4 py-3 shadow-sm">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand text-xs font-bold text-cocoa">
          {badgeLabel}
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-cocoa/60"
        />
      </div>
    </label>
  );
}

function ModeSwitch({ mode }: { mode: ProductLibraryMode }) {
  const t = useT();

  return (
    <div className="inline-flex rounded-[1.2rem] border border-white/80 bg-sand/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      {(["active", "archived"] as const).map((option) => {
        const isCurrent = option === mode;

        return (
          <Link
            key={option}
            href={getProductLibraryHref(option)}
            aria-current={isCurrent ? "page" : undefined}
            className={[
              "rounded-[1rem] px-4 py-2 text-sm font-semibold transition duration-200",
              isCurrent
                ? "border border-white/90 bg-white text-ink shadow-sm"
                : "text-cocoa/85 hover:bg-white/60 hover:text-ink",
            ].join(" ")}
          >
            {option === "active"
              ? t("products.mode.active")
              : t("products.mode.archived")}
          </Link>
        );
      })}
    </div>
  );
}

function ProductCard({
  product,
  mode,
}: {
  product: ProductSummary;
  mode: ProductLibraryMode;
}) {
  const t = useT();

  return (
    <Link
      href={getProductDictionaryEditHref(product.id, mode)}
      className={[
        "group block rounded-[1.35rem] border px-4 py-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/35 focus-visible:ring-offset-2",
        mode === "archived"
          ? "border-white/70 bg-almond/55 hover:bg-almond/70"
          : "border-white/80 bg-white/92 hover:bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 text-ink">
            {product.displayName}
          </p>
          <p className="mt-1 text-xs font-medium text-cocoa">
            {t("products.list.aliasCount", { count: product.aliasCount })}
          </p>
        </div>

        <span className="mt-0.5 inline-flex shrink-0 items-center text-cocoa/55 group-hover:text-cocoa">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4.5 9.5 8 6 11.5" />
          </svg>
        </span>
      </div>

      {product.aliasNames.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {product.aliasNames.slice(0, 3).map((alias) => (
            <span
              key={alias}
              className="rounded-full bg-sand/80 px-2.5 py-1 text-[11px] font-semibold text-cocoa"
            >
              {alias}
            </span>
          ))}
          {product.aliasNames.length > 3 ? (
            <span className="rounded-full bg-sand/60 px-2.5 py-1 text-[11px] font-semibold text-cocoa">
              +{product.aliasNames.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

function EmptyState({
  mode,
  isSearchEmpty,
}: {
  mode: ProductLibraryMode;
  isSearchEmpty: boolean;
}) {
  const t = useT();

  return (
    <SurfaceCard className="overflow-hidden bg-gradient-to-br from-white via-cream to-almond p-0">
      <div className="px-5 py-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-sm font-bold text-ink">
          {t("navigation.badges.products")}
        </div>
        <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-ink">
          {isSearchEmpty
            ? t("products.list.empty.search.title")
            : mode === "active"
              ? t("products.list.empty.active.title")
              : t("products.list.empty.archived.title")}
        </h2>
        <p className="mt-3 max-w-[32ch] text-sm leading-6 text-cocoa">
          {isSearchEmpty
            ? t("products.list.empty.search.description")
            : mode === "active"
              ? t("products.list.empty.active.description")
              : t("products.list.empty.archived.description")}
        </p>
        {!isSearchEmpty ? (
          <Link
            href={getProductDictionaryCreateHref()}
            className="mt-5 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
          >
            {t("products.actions.addProduct")}
          </Link>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function ProductsListScreen({
  initialProducts,
  mode,
  errorMessage,
}: {
  initialProducts: ProductSummary[];
  mode: ProductLibraryMode;
  errorMessage?: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = initialProducts.filter((product) => {
    if (!normalizedQuery) {
      return true;
    }

    return [product.displayName, ...product.aliasNames].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow={t("products.header.eyebrow")}
        title={t("products.header.title")}
        description={t("products.header.description")}
      />

      <section className="rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white via-cream to-almond px-4 py-4 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ModeSwitch mode={mode} />
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-cocoa shadow-sm">
                {t("products.list.count", { count: initialProducts.length })}
              </span>
            </div>

            <p className="max-w-[34ch] text-sm leading-6 text-cocoa">
              {mode === "active"
                ? t("products.list.activeDescription")
                : t("products.list.archivedDescription")}
            </p>
          </div>

          <Link
            href={getProductDictionaryCreateHref()}
            className="inline-flex rounded-[1.2rem] bg-clay px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            {t("products.actions.addProduct")}
          </Link>
        </div>

        <div className="mt-4">
          <SearchField
            value={query}
            onChange={setQuery}
            label={t("products.search.label")}
            placeholder={t("products.search.placeholder")}
            badgeLabel={t("common.badges.search")}
          />
        </div>
      </section>

      {errorMessage ? (
        <SurfaceCard className="border-clay/20 bg-white/90">
          <p className="text-sm font-semibold text-ink">
            {t("products.list.errorTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-cocoa">{errorMessage}</p>
        </SurfaceCard>
      ) : null}

      {!errorMessage && initialProducts.length === 0 ? (
        <EmptyState mode={mode} isSearchEmpty={false} />
      ) : null}

      {!errorMessage && initialProducts.length > 0 && filteredProducts.length === 0 ? (
        <EmptyState mode={mode} isSearchEmpty />
      ) : null}

      {!errorMessage && filteredProducts.length > 0 ? (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} mode={mode} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
