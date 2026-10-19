import { describe, expect, it } from "vitest";

import { buildCmsBotReply, rankCmsSearchItems } from "@/modules/cms/logic";

describe("CMS bot search", () => {
  const items = [
    {
      id: "website",
      kind: "package" as const,
      title: "Website Starter",
      body: "Responsive business website with SEO and WhatsApp forms.",
      keywords: ["website", "landing page"],
      price: 45000,
      timeline: "2-3 weeks",
    },
    {
      id: "automation",
      kind: "package" as const,
      title: "AI Automation",
      body: "Automate qualification, support, and follow-ups.",
      keywords: ["ai", "automation", "whatsapp bot"],
      price: 90000,
      timeline: "3-5 weeks",
    },
  ];

  it("ranks matching published content", () => {
    expect(rankCmsSearchItems("I need WhatsApp AI automation", items)[0]?.item.id).toBe(
      "automation",
    );
  });

  it("creates a controlled reply with price and timeline", () => {
    expect(buildCmsBotReply(items[0])).toContain("PKR 45,000");
    expect(buildCmsBotReply(items[0])).toContain("2-3 weeks");
  });
});
