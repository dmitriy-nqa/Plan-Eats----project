"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useT } from "@/lib/i18n/provider";
import { appNavigation } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="shrink-0 border-t border-white/80 bg-cream/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] pt-2 backdrop-blur sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pt-3">
      <ul className="grid grid-cols-4 gap-2">
        {appNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-[64px] flex-col items-center justify-center rounded-3xl px-2 py-2.5 text-center transition sm:min-h-[68px] sm:py-3",
                  isActive
                    ? "bg-white text-ink shadow-card"
                    : "text-cocoa/80 hover:bg-white/70 hover:text-ink",
                ].join(" ")}
              >
                <span
                  className={[
                    "mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:mb-2",
                    isActive ? "bg-blush text-ink" : "bg-sand text-cocoa",
                  ].join(" ")}
                >
                  {t(item.badgeKey)}
                </span>
                <span className="text-[11px] font-semibold leading-tight">
                  {t(item.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
