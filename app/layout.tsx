import type { Metadata } from "next";
import { HydrationReady } from "../components/hydration-ready";
import { StoreFooter } from "../components/store-footer";
import { StoreHeader } from "../components/store-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karatekas Gear",
  description:
    "Интернет-магазин экипировки для карате с B2C/B2B ценами, складом, счетами, оплатой и доставкой по Балтии.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('kg-prehydrate')",
          }}
        />
        <HydrationReady />
        <StoreHeader />
        <main>{children}</main>
        <StoreFooter />
      </body>
    </html>
  );
}
