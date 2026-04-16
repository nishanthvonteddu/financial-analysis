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
    default: "MySubscription Tracker",
    template: "%s | MySubscription Tracker",
  },
  description:
    "Track recurring spending, import statement files, and manage renewal risk from one deliberate workspace.",
  applicationName: "MySubscription Tracker",
  keywords: [
    "subscriptions",
    "renewals",
    "expense tracking",
    "dashboard",
    "statement imports",
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "MySubscription Tracker",
    description:
      "Track recurring spending, import statement files, and manage renewal risk from one deliberate workspace.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MySubscription Tracker",
    description:
      "Track recurring spending, import statement files, and manage renewal risk from one deliberate workspace.",
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
