"use client";

import { errorSurfaceClassName } from "@/components/ui/presentation";
import { useLocale } from "@/lib/i18n/provider";
import { getShoppingListCopy } from "@/lib/shopping-list-copy";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();
  const copy = getShoppingListCopy(locale);

  return (
    <div className="space-y-4">
      <section className={`rounded-[1.5rem] border p-4 shadow-card ${errorSurfaceClassName}`}>
        <p className="text-sm font-semibold text-ink">{copy.error.title}</p>
        <p className="mt-2 text-sm leading-6 text-cocoa">
          {error.message || copy.error.description}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
        >
          {copy.actions.retry}
        </button>
      </section>
    </div>
  );
}
