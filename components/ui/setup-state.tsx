import Link from "next/link";

import { SurfaceCard } from "@/components/ui/surface-card";

export function SetupState({
  title,
  description,
  hint,
  badgeLabel,
  ctaLabel = "Back to Dish Library",
  ctaHref = "/dishes",
}: {
  title: string;
  description: string;
  hint?: string;
  badgeLabel: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <SurfaceCard className="overflow-hidden bg-gradient-to-br from-white via-cream to-almond p-0">
      <div className="px-5 py-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-sm font-bold text-ink">
          {badgeLabel}
        </div>
        <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-3 max-w-[34ch] text-sm leading-6 text-cocoa">
          {description}
        </p>
        {hint ? (
          <p className="mt-3 rounded-2xl bg-white/85 px-4 py-3 text-sm leading-6 text-cocoa">
            {hint}
          </p>
        ) : null}
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-2xl bg-clay px-4 py-3 text-sm font-semibold text-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </SurfaceCard>
  );
}
