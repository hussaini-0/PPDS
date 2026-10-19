import { env } from "@/lib/env";

export function getPublicWhatsAppNumber() {
  const digits = env.WHATSAPP_PUBLIC_NUMBER.replace(/\D/g, "");
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

export function getPublicWhatsAppUrl(message?: string) {
  const number = getPublicWhatsAppNumber();

  if (!number) return "/contact";

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}
