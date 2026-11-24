import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeInitializer } from "@/components/theme-initializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Harizeon · Console",
    template: "%s · Harizeon",
  },
  description:
    "Security infrastructure, provisioned like cloud. Scan, monitor, and prove the security of everything you own.",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      translate="no"
      suppressHydrationWarning
      className={`notranslate ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="notranslate min-h-full bg-canvas text-ink" suppressHydrationWarning>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
