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
  const chBoxSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const imageSize = size === "sm" ? 24 : 32;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("font-bold tracking-tight leading-none", textSize)}
      >
        <span className="text-white">HBAR</span>
        <span className="text-violet-400">Skills</span>
      </span>
      {showByCh && (
        <>
          <span
            className={cn(
              "font-normal text-muted-foreground leading-none",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            by
          </span>
          <Link
            href="https://canhav.co"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex shrink-0 items-center justify-center hover:opacity-80 transition-opacity",
              chBoxSize
            )}
            aria-label="canhav.co"
          >
            <Image
              src="/favicon.png"
              alt="ch."
              width={imageSize}
              height={imageSize}
              className="h-full w-full object-contain"
            />
          </Link>
        </>
      )}
    </span>
  );
}
