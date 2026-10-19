export type CmsSearchItem = {
  id: string;
  kind: "product" | "package" | "faq";
  title: string;
  body: string;
  keywords: string[];
  price?: number | null;
  timeline?: string | null;
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function rankCmsSearchItems(query: string, items: CmsSearchItem[]) {
  const queryTokens = new Set(tokenize(query));

  return items
    .map((item) => {
      const searchable = tokenize(
        `${item.title} ${item.body} ${item.keywords.join(" ")}`,
      );
      const score = searchable.reduce(
        (total, token) => total + (queryTokens.has(token) ? 1 : 0),
        0,
      );
      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function buildCmsBotReply(item: CmsSearchItem, currency = "PKR") {
  const price = item.price
    ? ` Starting from ${currency} ${item.price.toLocaleString("en-PK")}.`
    : " Pricing is confirmed after scope review.";
  const timeline = item.timeline ? ` Typical timeline: ${item.timeline}.` : "";

  return `${item.title}: ${item.body}${price}${timeline} Reply \"human\" if you want the owner to prepare a quotation.`;
}
