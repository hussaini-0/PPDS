import Image from "next/image";

export function ProductMedia({ src, alt, fit = "cover", sizes }: {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  sizes: string;
}) {
  const objectClass = fit === "contain" ? "object-contain" : "object-cover";
  if (src.startsWith("/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={objectClass} />;
  }
  return <span role="img" aria-label={alt} className="absolute inset-0 bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(src)})`, backgroundSize: fit }} />;
}
