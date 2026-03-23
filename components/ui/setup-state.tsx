import Link from "next/link";

import {
  inlineInfoClassName,
  stateSurfaceBadgeClassName,
  stateSurfaceBodyClassName,
  stateSurfaceClassName,
  stateSurfaceDescriptionClassName,
  stateSurfaceTitleClassName,
} from "@/components/ui/presentation";
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
    <SurfaceCard className={stateSurfaceClassName}>
      <div className={stateSurfaceBodyClassName}>
        <div className={stateSurfaceBadgeClassName}>
          {badgeLabel}
        </div>
        <h2 className={stateSurfaceTitleClassName}>
          {title}
        </h2>
        <p className={stateSurfaceDescriptionClassName}>
          {description}
        </p>
        {hint ? (
          <p className={`mt-4 ${inlineInfoClassName}`}>
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
