export type PpdsCatalogueItem = {
  slug: string;
  name: string;
  category: { slug: string; name: string };
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: null;
  imageUrl: null;
  logoUrl: string;
  badge: null;
  features: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  sortOrder: number;
  status: "PUBLISHED";
};

type CatalogueGroup = {
  slug: string;
  name: string;
  description: string;
  services: string[];
};

const groups: CatalogueGroup[] = [
  { slug: "entertainment-streaming", name: "Entertainment & Streaming", description: "No ads, HD/4K, monthly and yearly plans.", services: ["Netflix", "Prime Video", "Disney+", "Hulu", "ESPN", "Peacock TV", "WWE", "Paramount+", "Showtime", "HBO Max", "Hotstar", "SonyLIV", "JioHotstar", "Hoichoi", "Masti OTT", "MX Gold", "Hungama OTT", "Kable One", "Hilal Play", "Lionsgate Play", "Zee5", "Plex", "Gaana", "Eros Now", "Cricbuzz Premium", "Rakuten Viki", "Apple TV+", "Apple Music", "Discovery+", "Curiosity Stream", "Crunchyroll", "Chaupal", "ShemarooMe", "ALTBalaji", "Ullu", "Atrangii", "PrimeShots", "Hotflix", "Vivamax", "YouTube Premium", "Tapmad", "Spotify Premium"] },
  { slug: "vpn-services", name: "VPN Services", description: "Privacy, security and global access.", services: ["Proton VPN", "ExpressVPN", "NordVPN", "Surfshark VPN", "Windscribe VPN", "Private Internet Access", "CyberGhost VPN", "Hotspot Shield", "IPVanish", "Avast VPN", "Norton VPN"] },
  { slug: "iptv-services", name: "IPTV Services", description: "Live TV, sports, movies and 24/7 support.", services: ["IPTV Rolex", "BosTV", "Opplex", "Bravo IPTV", "Geo IPTV", "StarShare", "B1G IPTV", "5G Live", "Zain TV", "Mega IPTV", "Trex IPTV", "Strong 8K", "Hot Player"] },
  { slug: "creative-ai-utility", name: "Creative, AI & Utility", description: "Design, editing, writing, AI and software.", services: ["Adobe Creative Cloud", "ChatGPT Plus", "CapCut Pro", "Canva Pro", "Canva EDU", "PicsArt Pro", "Filmora 14", "Grammarly Premium", "QuillBot Premium", "Freepik Premium", "Jenni AI", "Grok AI", "Perplexity Pro", "Muse AI", "ElevenLabs", "HeyGen", "Higgsfield", "VidiQ Boost", "TradingView Premium", "Envato Elements", "Microsoft 365", "Windows 11 Key", "Coursera Plus", "Google AI Pro", "LinkedIn Premium"] },
  { slug: "smm-services", name: "Social Media Growth", description: "Likes, followers, views and engagement.", services: ["YouTube Growth", "Instagram Growth", "Facebook Growth", "TikTok Growth", "X Growth", "Telegram Growth", "Spotify Growth", "SoundCloud Growth", "LinkedIn Growth", "Twitch Growth"] },
];

const iconNames: Record<string, string> = {
  "Netflix": "netflix", "Prime Video": "primevideo", "Disney+": "disneyplus", "Hulu": "hulu", "ESPN": "espn", "Peacock TV": "peacock", "Paramount+": "paramountplus", "Showtime": "showtime", "HBO Max": "max", "Hotstar": "hotstar", "SonyLIV": "sonyliv", "Hoichoi": "hoichoi", "Zee5": "zee5", "Plex": "plex", "Gaana": "gaana", "Apple TV+": "appletv", "Apple Music": "applemusic", "Discovery+": "discoveryplus", "Crunchyroll": "crunchyroll", "YouTube Premium": "youtube", "Spotify Premium": "spotify", "Proton VPN": "protonvpn", "ExpressVPN": "expressvpn", "NordVPN": "nordvpn", "Surfshark VPN": "surfshark", "Windscribe VPN": "windscribe", "Private Internet Access": "privateinternetaccess", "CyberGhost VPN": "cyberghost", "Hotspot Shield": "hotspotshield", "IPVanish": "ipvanish", "Avast VPN": "avast", "Norton VPN": "norton", "Adobe Creative Cloud": "adobecreativecloud", "ChatGPT Plus": "openai", "CapCut Pro": "capcut", "Canva Pro": "canva", "Canva EDU": "canva", "PicsArt Pro": "picsart", "Grammarly Premium": "grammarly", "QuillBot Premium": "quillbot", "Freepik Premium": "freepik", "Perplexity Pro": "perplexity", "ElevenLabs": "elevenlabs", "HeyGen": "heygen", "TradingView Premium": "tradingview", "Envato Elements": "envato", "Microsoft 365": "microsoftoffice", "Windows 11 Key": "windows", "Coursera Plus": "coursera", "Google AI Pro": "google", "LinkedIn Premium": "linkedin", "YouTube Growth": "youtube", "Instagram Growth": "instagram", "Facebook Growth": "facebook", "TikTok Growth": "tiktok", "X Growth": "x", "Telegram Growth": "telegram", "Spotify Growth": "spotify", "SoundCloud Growth": "soundcloud", "LinkedIn Growth": "linkedin", "Twitch Growth": "twitch",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function logoFor(service: string) {
  return `https://cdn.simpleicons.org/${iconNames[service] ?? "appstore"}`;
}

export const PPDS_CATALOG: PpdsCatalogueItem[] = groups.flatMap((group, groupIndex) =>
  group.services.map((name, serviceIndex) => ({
    slug: `${group.slug}-${slugify(name)}`,
    name,
    category: { slug: group.slug, name: group.name },
    shortDescription: `${name} access from PPDS. ${group.description}`,
    description: `${name} subscription service from PPDS. Confirm plan duration, access terms and delivery before payment.`,
    price: 999,
    compareAtPrice: null,
    imageUrl: null,
    logoUrl: logoFor(name),
    badge: null,
    features: ["PPDS support", "Terms confirmed before payment"],
    isFeatured: groupIndex === 0 && serviceIndex < 5,
    isBestSeller: false,
    sortOrder: groupIndex * 100 + serviceIndex,
    status: "PUBLISHED",
  })),
);

export const PPDS_CATALOG_CATEGORIES = groups.map(({ slug, name, description }, index) => ({ slug, name, description, icon: "PPDS", sortOrder: index }));

export function mergePpdsCatalogue<T extends { slug: string; category: { slug: string } }>(products: T[]): Array<T | PpdsCatalogueItem> {
  const configured = new Map(products.map((product) => [product.slug, product]));
  const catalogue = PPDS_CATALOG.map((service) => configured.get(service.slug) ?? service);
  const additionalProducts = products.filter((product) => !PPDS_CATALOG.some((service) => service.slug === product.slug));
  return [...catalogue, ...additionalProducts];
}
