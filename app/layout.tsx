import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";

import { LocaleProvider } from "@/lib/i18n/provider";
import { getRequestLocale } from "@/lib/i18n/server";

import "./globals.css";

const headingFont = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const bodyFont = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Plan&Eat",
  description: "A cozy family meal-planning shell for the Plan&Eat MVP.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} [font-family:var(--font-body)] antialiased`}
      >
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
