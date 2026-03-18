import type { TranslationKey } from "@/lib/i18n/config";

export const appNavigation: Array<{
  href: string;
  labelKey: TranslationKey;
  badgeKey: TranslationKey;
}> = [
  {
    href: "/",
    labelKey: "navigation.bottom.weeklyMenu",
    badgeKey: "navigation.badges.weeklyMenu",
  },
  {
    href: "/dishes",
    labelKey: "navigation.bottom.dishLibrary",
    badgeKey: "navigation.badges.dishLibrary",
  },
  {
    href: "/products",
    labelKey: "navigation.bottom.products",
    badgeKey: "navigation.badges.products",
  },
  {
    href: "/settings",
    labelKey: "navigation.bottom.settings",
    badgeKey: "navigation.badges.settings",
  },
];
