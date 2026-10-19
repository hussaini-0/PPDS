import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/products", "/software-development", "/project-request", "/deals", "/about", "/contact", "/faqs", "/privacy", "/terms", "/refund-delivery"].map((path) => ({ url: `${env.APP_URL}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7 }));
}
