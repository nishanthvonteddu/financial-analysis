import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "FinSight",
    template: "%s | FinSight",
  },
  description:
    "Analyze statements, cash-flow trends, recurring exposure, and savings opportunities from one financial workspace.",
  applicationName: "FinSight",
  keywords: [
    "financial analysis",
    "cash flow",
    "spend analysis",
    "dashboard",
    "statement imports",
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "FinSight",
    description:
      "Analyze statements, cash-flow trends, recurring exposure, and savings opportunities from one financial workspace.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FinSight",
    description:
      "Analyze statements, cash-flow trends, recurring exposure, and savings opportunities from one financial workspace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${instrumentSerif.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
