"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-white/80 bg-cream/95 px-2 pb-4 pt-3 backdrop-blur">
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
                  "flex min-h-[68px] flex-col items-center justify-center rounded-3xl px-2 py-3 text-center transition",
                  isActive
                    ? "bg-white text-ink shadow-card"
                    : "text-cocoa/80 hover:bg-white/70 hover:text-ink",
                ].join(" ")}
              >
                <span
                  className={[
                    "mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    isActive ? "bg-blush text-ink" : "bg-sand text-cocoa",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
                <span className="text-[11px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
