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
  title: "MySubscription Tracker",
  description: "Track recurring spending with a calm, deliberate workflow.",
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
