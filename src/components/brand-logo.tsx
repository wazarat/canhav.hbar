import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md";
  showByCh?: boolean;
  className?: string;
};

export function BrandLogo({
  size = "md",
  showByCh = true,
  className,
}: BrandLogoProps) {
  const textSize = size === "sm" ? "text-base" : "text-xl";
  const imageSize = size === "sm" ? 20 : 24;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("font-bold tracking-tight", textSize)}>
        <span className="text-violet-400">HBAR</span>
        <span className="text-sky-400">Skills</span>
      </span>
      {showByCh && (
        <>
          <span
            className={cn(
              "font-normal text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            by
          </span>
          <Link
            href="https://canhav.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
            aria-label="canhav.co"
          >
            <Image
              src="/favicon.png"
              alt="ch."
              width={imageSize}
              height={imageSize}
              className="rounded-sm"
            />
          </Link>
        </>
      )}
    </span>
  );
}
