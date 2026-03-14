"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Menu, X, Wallet, LogOut, Loader2 } from "lucide-react";
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
  { href: "/market-map", label: "Market Map" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWalletStore();

  return (
    <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">
            CanHav<span className="text-primary">.HBAR</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
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
                  className="cursor-pointer hover:bg-muted transition-colors hidden sm:flex"
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
            <Button size="sm" onClick={connect} disabled={isConnecting}>
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
        <div className="md:hidden border-t border-border/40 bg-background px-4 pb-4">
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
