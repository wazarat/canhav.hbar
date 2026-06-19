import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "HBARSkills — Modern Agentic Tools for DeFi",
  description:
    "Agent marketplace and skills platform for decentralized finance on Hedera.",
  openGraph: {
    title: "HBARSkills by ch.",
    description:
      "Modern agentic tools for decentralized finance — skills, agents, and ecosystem intelligence.",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
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
