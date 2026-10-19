import Image from "next/image";

export function BrandLogo({ size = "compact" }: { size?: "compact" | "hero" }) {
  const isHero = size === "hero";

  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-[#202224] ${
        isHero
          ? "h-[4.5rem] w-64 rounded-2xl sm:h-[5.5rem] sm:w-[19rem]"
          : "h-12 w-40 rounded-xl"
      }`}
    >
      <Image
        src="/ppds-logo.png"
        alt="PPDS"
        width={654}
        height={650}
        priority
        className={`absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 ${
          isHero ? "w-[20rem] sm:w-[25rem]" : "w-52"
        }`}
      />
    </span>
  );
}
