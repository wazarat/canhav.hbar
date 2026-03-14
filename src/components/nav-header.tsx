"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { href: "/skills", label: "Skills" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/market-map", label: "Market Map" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Button size="sm">Connect Wallet</Button>
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
