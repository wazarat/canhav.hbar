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
  const byTextSize = size === "sm" ? "text-[10px]" : "text-xs";
  const chBoxSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const imageSize = size === "sm" ? 16 : 20;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("font-bold tracking-tight leading-none", textSize)}
      >
        <span className="text-white">HBAR</span>
        <span className="text-violet-400">Skills</span>
      </span>
      {showByCh && (
        <span className="inline-flex items-center gap-1">
          <span
            className={cn(
              "font-normal text-muted-foreground leading-none",
              byTextSize
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
              src="/mark.svg"
              alt="ch."
              width={imageSize}
              height={imageSize}
              className="h-full w-full object-contain"
            />
          </Link>
        </span>
      )}
    </span>
  );
}
