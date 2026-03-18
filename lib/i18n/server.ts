import { cookies } from "next/headers";

import {
  defaultLocale,
  isAppLocale,
  localeCookieName,
  type AppLocale,
} from "@/lib/i18n/config";

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : defaultLocale;
}

export async function getRequestLocale() {
  const cookieStore = await cookies();

  return resolveLocale(cookieStore.get(localeCookieName)?.value);
}
