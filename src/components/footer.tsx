import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-border/20 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <BrandLogo />
            <p className="text-sm text-muted-foreground">
              © 2026{" "}
              <Link
                href="https://canhav.co"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                canhav.co
              </Link>
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/skills"
              className="hover:text-foreground transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/market-map"
              className="hover:text-foreground transition-colors"
            >
              Market Map
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
