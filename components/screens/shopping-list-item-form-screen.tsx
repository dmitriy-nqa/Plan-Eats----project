"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ScreenHeader } from "@/components/ui/screen-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useLocale } from "@/lib/i18n/provider";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";
import {
  initialShoppingListFormSubmissionState,
  shoppingListUnits,
  type ShoppingListFormSubmissionState,
  type ShoppingListFormValues,
} from "@/lib/shopping-list-form";
import type { ShoppingListSourceType } from "@/lib/shopping-list";

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
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending
        ? copy.actions.saving
        : mode === "add"
          ? copy.actions.saveItem
          : copy.actions.saveChanges}
    </button>
  );
}

export function ShoppingListItemFormScreen({
  mode,
  initialValues,
  saveAction,
  itemId,
  sourceType = "manual",
  deleteAction,
}: {
  mode: "add" | "edit";
  initialValues: ShoppingListFormValues;
  saveAction: (
    state: ShoppingListFormSubmissionState,
    formData: FormData,
  ) => Promise<ShoppingListFormSubmissionState>;
  itemId?: string;
  sourceType?: ShoppingListSourceType;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);
  const [form, setForm] = useState(initialValues);
  const [submissionState, submitAction] = useActionState(
    saveAction,
    initialShoppingListFormSubmissionState,
  );
  const sourceDescription =
    mode === "add"
      ? copy.form.sourceAdd
      : sourceType === "manual"
        ? copy.form.sourceManualEdit
        : copy.form.sourceAutoEdit;
  const destructiveLabel =
    sourceType === "manual" ? copy.form.deleteManual : copy.form.hideAuto;

  return (
    <div className="space-y-4">
      <form action={submitAction} className="space-y-4">
        {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
        <input type="hidden" name="locale" value={locale} />

        <div className="flex items-center gap-3 text-sm font-semibold text-cocoa">
          <Link
            href="/products"
            className="rounded-full bg-white/90 px-3 py-2 shadow-sm"
          >
            {copy.form.backToProducts}
          </Link>
        </div>

        <ScreenHeader
          eyebrow={copy.header.eyebrow}
          title={mode === "add" ? copy.form.addTitle : copy.form.editTitle}
          description={mode === "add" ? copy.form.addDescription : copy.form.editDescription}
        />

        <SurfaceCard className="bg-white/80">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa">
            {copy.form.sourceCardLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-cocoa">{sourceDescription}</p>
        </SurfaceCard>

        <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-cream to-almond">
          <div>
            <FieldLabel>{copy.form.nameLabel}</FieldLabel>
            <TextInput
              name="ingredientName"
              value={form.ingredientName}
              onChange={(ingredientName) => setForm((current) => ({ ...current, ingredientName }))}
              placeholder={copy.form.namePlaceholder}
              required
              hasError={Boolean(submissionState.fieldErrors.ingredientName)}
            />
            <FieldError message={submissionState.fieldErrors.ingredientName} />
          </div>

          <div className="grid grid-cols-[1fr_104px] gap-3">
            <div>
              <FieldLabel>{copy.form.quantityLabel}</FieldLabel>
              <TextInput
                name="quantity"
                value={form.quantity}
                onChange={(quantity) => setForm((current) => ({ ...current, quantity }))}
                placeholder={copy.form.quantityPlaceholder}
                required
                hasError={Boolean(submissionState.fieldErrors.quantity)}
              />
              <FieldError message={submissionState.fieldErrors.quantity} />
            </div>

            <div>
              <FieldLabel>{copy.form.unitLabel}</FieldLabel>
              <select
                name="unit"
                value={form.unit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unit: event.target.value as ShoppingListFormValues["unit"],
                  }))
                }
                className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm text-ink outline-none"
              >
                {shoppingListUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-3 bg-white/80">
          <FieldError message={submissionState.formError} />
          <div className="grid grid-cols-2 gap-3">
            <SubmitButton mode={mode} />
            <Link
              href="/products"
              className="rounded-2xl border border-clay/30 px-4 py-3 text-center text-sm font-semibold text-cocoa"
            >
              {copy.form.backToProducts}
            </Link>
          </div>
        </SurfaceCard>
      </form>

      {mode === "edit" && itemId && deleteAction ? (
        <SurfaceCard className="space-y-4 bg-white/85">
          <p className="text-sm leading-6 text-cocoa">{sourceDescription}</p>
          <form action={deleteAction}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="redirectTo" value="/products" />
            <button
              type="submit"
              className="w-full rounded-2xl border border-[#d8b4b4] bg-white px-4 py-3 text-sm font-semibold text-[#9b5353]"
            >
              {destructiveLabel}
            </button>
          </form>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
