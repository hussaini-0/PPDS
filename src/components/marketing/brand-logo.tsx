import Image from "next/image";

export function BrandLogo({ size = "compact" }: { size?: "compact" | "hero" }) {
  const isHero = size === "hero";

  return (
    <span
      className={`relative block shrink-0 ${
        isHero
          ? "h-24 w-[22rem] sm:h-28 sm:w-[28rem]"
          : "h-14 w-40 sm:h-16 sm:w-48"
      }`}
    >
      <Image
        src="/ppds-logo-transparent.png"
        alt="PPDS"
        width={1713}
        height={645}
        priority
        className="h-full w-full object-contain object-left"
      />
    </span>
  );
}
