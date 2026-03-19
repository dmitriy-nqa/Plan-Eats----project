"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createEmptyAlias,
  initialProductFormSubmissionState,
  type ProductFormSubmissionState,
  type ProductFormValues,
} from "@/lib/product-form";
import { useLocale, useT } from "@/lib/i18n/provider";
import {
  getProductDictionaryEditHref,
  getProductLibraryHref,
  type ProductLibraryMode,
} from "@/lib/products";

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

function SubmitButton({ mode }: { mode: "add" | "edit" }) {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending
        ? t("products.form.actions.saving")
        : mode === "add"
          ? t("products.form.actions.saveProduct")
          : t("products.form.actions.saveChanges")}
    </button>
  );
}

function DuplicateHint({ state }: { state: ProductFormSubmissionState }) {
  const t = useT();

  if (!state.duplicate || state.duplicate.kind === "valid") {
    return null;
  }

  const href = state.duplicate.productId
    ? getProductDictionaryEditHref(
        state.duplicate.productId,
        state.duplicate.isArchived ? "archived" : "active",
      )
    : null;

  const message =
    state.duplicate.kind === "archived_collision"
      ? t("products.form.duplicate.archived", {
          name: state.duplicate.productName ?? "",
        })
      : state.duplicate.kind === "alias_collision"
        ? t("products.form.duplicate.alias", {
            name: state.duplicate.productName ?? "",
            alias: state.duplicate.aliasName ?? "",
          })
        : state.duplicate.kind === "token_duplicate"
          ? t("products.form.duplicate.token", {
              name: state.duplicate.productName ?? "",
            })
          : t("products.form.duplicate.canonical", {
              name: state.duplicate.productName ?? "",
            });

  return (
    <div className="rounded-[1.25rem] border border-[#e3c3a7] bg-[#fff7ef] px-4 py-3">
      <p className="text-sm leading-6 text-cocoa">{message}</p>
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-cocoa shadow-sm"
        >
          {state.duplicate.kind === "archived_collision"
            ? t("products.form.duplicate.openArchived")
            : t("products.form.duplicate.openExisting")}
        </Link>
      ) : null}
    </div>
  );
}

export function ProductFormScreen({
  mode: formMode,
  initialValues,
  saveAction,
  productId,
  libraryMode = "active",
  isArchived = false,
  archiveAction,
  restoreAction,
}: {
  mode: "add" | "edit";
  initialValues: ProductFormValues;
  saveAction: (
    state: ProductFormSubmissionState,
    formData: FormData,
  ) => Promise<ProductFormSubmissionState>;
  productId?: string;
  libraryMode?: ProductLibraryMode;
  isArchived?: boolean;
  archiveAction?: (formData: FormData) => Promise<void>;
  restoreAction?: (formData: FormData) => Promise<void>;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [form, setForm] = useState(initialValues);
  const nextAliasId = useRef(initialValues.aliases.length + 1);
  const [submissionState, submitAction] = useActionState(
    saveAction,
    initialProductFormSubmissionState,
  );

  function updateAlias(index: number, value: string) {
    setForm((current) => ({
      ...current,
      aliases: current.aliases.map((alias, aliasIndex) =>
        aliasIndex === index ? { ...alias, value } : alias,
      ),
    }));
  }

  function addAliasRow() {
    const alias = createEmptyAlias(`alias-${nextAliasId.current}`);
    nextAliasId.current += 1;

    setForm((current) => ({
      ...current,
      aliases: [...current.aliases, alias],
    }));
  }

  function removeAliasRow(index: number) {
    setForm((current) => {
      if (current.aliases.length === 1) {
        return {
          ...current,
          aliases: [createEmptyAlias(current.aliases[0].id)],
        };
      }

      return {
        ...current,
        aliases: current.aliases.filter((_, aliasIndex) => aliasIndex !== index),
      };
    });
  }

  return (
    <div className="space-y-4">
      <form action={submitAction} className="space-y-4">
        {productId ? <input type="hidden" name="productId" value={productId} /> : null}
        <input type="hidden" name="mode" value={libraryMode} />
        <input type="hidden" name="locale" value={locale} />

        <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
          <Link
            href={getProductLibraryHref(libraryMode)}
            className="rounded-full bg-white/90 px-3 py-2 shadow-sm"
          >
            {t("products.navigation.backToLibrary")}
          </Link>
          <span className="rounded-full bg-blush px-3 py-2 text-ink">
            {formMode === "add"
              ? t("products.form.badges.newProduct")
              : isArchived
                ? t("products.form.badges.archived")
                : t("products.form.badges.editMode")}
          </span>
        </div>

        <ScreenHeader
          eyebrow={t("products.form.header.eyebrow")}
          title={
            formMode === "add"
              ? t("products.form.header.createTitle")
              : t("products.form.header.editTitle")
          }
          description={
            formMode === "add"
              ? t("products.form.header.createDescription")
              : t("products.form.header.editDescription")
          }
        />

        <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
          <div>
            <FieldLabel>{t("products.form.fields.displayName")}</FieldLabel>
            <TextInput
              name="displayName"
              value={form.displayName}
              onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
              placeholder={t("products.form.placeholders.displayName")}
              required
              hasError={Boolean(submissionState.fieldErrors.displayName)}
            />
            <FieldError message={submissionState.fieldErrors.displayName} />
          </div>

          <DuplicateHint state={submissionState} />

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {t("products.form.aliases.title")}
                </p>
                <p className="mt-1 text-sm text-cocoa">
                  {t("products.form.aliases.description")}
                </p>
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
                {t("products.form.aliases.rowsCount", { count: form.aliases.length })}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {form.aliases.map((alias, index) => (
                <div
                  key={alias.id}
                  className="rounded-[1.35rem] border border-white/80 bg-white/85 p-3 shadow-sm"
                >
                  <TextInput
                    name="aliasName"
                    value={alias.value}
                    onChange={(value) => updateAlias(index, value)}
                    placeholder={t("products.form.placeholders.alias")}
                    hasError={Boolean(submissionState.fieldErrors.aliasRows[index])}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeAliasRow(index)}
                      disabled={form.aliases.length === 1}
                      className="rounded-full border border-clay/30 px-3 py-2 text-xs font-semibold text-clay disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("products.form.aliases.removeRow")}
                    </button>
                  </div>
                  <FieldError message={submissionState.fieldErrors.aliasRows[index]} />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addAliasRow}
              className="mt-4 w-full rounded-2xl border border-dashed border-clay/40 bg-white px-4 py-3 text-sm font-semibold text-cocoa"
            >
              {t("products.form.aliases.addRow")}
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-3 bg-white/80">
          <p className="text-sm font-semibold text-ink">{t("products.form.actions.title")}</p>
          <FieldError message={submissionState.formError} />
          <div className="grid grid-cols-2 gap-3">
            <SubmitButton mode={formMode} />
            <Link
              href={getProductLibraryHref(libraryMode)}
              className="rounded-2xl border border-clay/30 px-4 py-3 text-center text-sm font-semibold text-cocoa"
            >
              {t("common.actions.cancel")}
            </Link>
          </div>
        </SurfaceCard>
      </form>

      {formMode === "edit" && productId && archiveAction && restoreAction ? (
        <SurfaceCard className="space-y-4 bg-white/85">
          <p className="text-sm font-semibold text-ink">{t("products.details.manageTitle")}</p>
          <p className="text-sm leading-6 text-cocoa">
            {isArchived
              ? t("products.details.archivedDescription")
              : t("products.details.activeDescription")}
          </p>
          <form action={isArchived ? restoreAction : archiveAction}>
            <input type="hidden" name="productId" value={productId} />
            <button
              type="submit"
              className={[
                "w-full rounded-2xl border px-4 py-3 text-sm font-semibold",
                isArchived
                  ? "border-leaf/30 bg-leaf/10 text-leaf"
                  : "border-clay/25 bg-white text-clay",
              ].join(" ")}
            >
              {isArchived ? t("common.actions.restore") : t("common.actions.archive")}
            </button>
          </form>
        </SurfaceCard>
      ) : null}

    </div>
  );
}
