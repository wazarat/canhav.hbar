"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { Menu, X, Wallet, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  useWalletStore,
  shortenAddress,
  getHashScanAddressUrl,
} from "@/lib/stores/wallet-store";

const links = [
  { href: "/skills", label: "Skills" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWalletStore();

  return (
    <header className="border-b border-border/20 backdrop-blur-md sticky top-0 z-50 bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <BrandLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm transition-colors",
                pathname === l.href || pathname?.startsWith(l.href + "/")
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <a
                href={getHashScanAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors hidden sm:flex border-border/40"
                >
                  <Wallet className="h-3 w-3 mr-1.5" />
                  {shortenAddress(address)}
                </Badge>
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={connect}
              disabled={isConnecting}
              className="brand-gradient text-white border-0 hover:opacity-90"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/20 bg-background/95 backdrop-blur-md px-4 pb-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block py-2 text-sm transition-colors",
                pathname === l.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
