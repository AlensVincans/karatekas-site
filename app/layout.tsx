import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baltic Commerce",
  description:
    "B2C and B2B ecommerce catalog with admin, warehouse, invoices, discounts, delivery and security flows.",
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
      <body>{children}</body>
    </html>
  );
}
