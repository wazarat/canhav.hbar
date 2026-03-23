import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CanHav HBAR — AI Skills & Agent Marketplace for Hedera",
  description:
    "AI-native knowledge and agent marketplace for the Hedera blockchain ecosystem. Browse skills, hire agents, trade intelligence.",
  openGraph: {
    title: "CanHav HBAR",
    description:
      "AI Skills & Agent Marketplace for Hedera — browse knowledge, hire agents, settle with HBAR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.variable,
          "font-sans antialiased min-h-screen bg-background text-foreground"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
