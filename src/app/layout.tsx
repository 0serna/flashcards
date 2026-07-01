import type { Metadata, Viewport } from "next";
import { appThemeColor } from "./theme-colors";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "A mobile-first flashcards PWA for spaced repetition study.",
};

export const viewport: Viewport = {
  themeColor: appThemeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
