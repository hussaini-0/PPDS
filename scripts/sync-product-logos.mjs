import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const iconify = {
  "Netflix": "logos:netflix",
  "Prime Video": "thesvg-color:prime-video",
  "Disney+": "thesvg-color:disney-plus",
  "Hulu": "selfhst:hulu",
  "ESPN": "thesvg-color:espn",
  "Peacock TV": "thesvg-color:peacock",
  "WWE": "simple-icons:wwe",
  "Paramount+": "selfhst:paramount-plus",
  "Showtime": "simple-icons:showtime",
  "HBO Max": "thesvg-color:hbo-max",
  "JioHotstar": "arcticons:jiohotstar",
  "Hoichoi": "arcticons:hoichoi",
  "Zee5": "arcticons:zee5",
  "Plex": "thesvg-color:plex",
  "Gaana": "arcticons:gaana",
  "Cricbuzz Premium": "arcticons:cricbuzz",
  "Apple TV+": "thesvg-color:apple-tv",
  "Apple Music": "thesvg-color:apple-music",
  "Curiosity Stream": "arcticons:curiositystream",
  "Crunchyroll": "thesvg-color:crunchyroll",
  "YouTube Premium": "logos:youtube",
  "Spotify Premium": "logos:spotify",
  "Proton VPN": "thesvg-color:proton-vpn",
  "ExpressVPN": "thesvg-color:expressvpn",
  "NordVPN": "thesvg-color:nordvpn",
  "Surfshark VPN": "thesvg-color:surfshark",
  "Windscribe VPN": "arcticons:windscribevpn",
  "Private Internet Access": "thesvg-color:private-internet-access",
  "CyberGhost VPN": "arcticons:cyberghost",
  "IPVanish": "selfhst:ipvanish",
  "Avast VPN": "thesvg-color:avast",
  "Norton VPN": "thesvg-color:norton",
  "Adobe Creative Cloud": "thesvg-color:adobe-creative-cloud",
  "ChatGPT Plus": "selfhst:chatgpt",
  "CapCut Pro": "thesvg-color:capcut",
  "Canva Pro": "thesvg-color:canva",
  "Canva EDU": "thesvg-color:canva",
  "PicsArt Pro": "thesvg-color:picsart",
  "Filmora 14": "thesvg-color:wondershare-filmora",
  "Grammarly Premium": "logos:grammarly",
  "QuillBot Premium": "arcticons:quillbot",
  "Freepik Premium": "thesvg-color:freepik",
  "Grok AI": "logos:grok",
  "Perplexity Pro": "logos:perplexity",
  "ElevenLabs": "logos:elevenlabs",
  "VidiQ Boost": "thesvg-color:vidiq",
  "TradingView Premium": "thesvg-color:tradingview",
  "Envato Elements": "logos:envato",
  "Microsoft 365": "selfhst:microsoft-365",
  "Windows 11 Key": "thesvg-color:windows",
  "Coursera Plus": "logos:coursera",
  "Google AI Pro": "logos:google-gemini",
  "LinkedIn Premium": "logos:linkedin",
  "YouTube Growth": "logos:youtube",
  "Instagram Growth": "logos:instagram-icon",
  "Facebook Growth": "logos:facebook",
  "TikTok Growth": "logos:tiktok-icon",
  "X Growth": "simple-icons:x",
  "Telegram Growth": "logos:telegram",
  "Spotify Growth": "logos:spotify",
  "SoundCloud Growth": "logos:soundcloud",
  "LinkedIn Growth": "logos:linkedin",
  "Twitch Growth": "logos:twitch",
};

const faviconDomains = {
  "Hotstar": "hotstar.com",
  "SonyLIV": "sonyliv.com",
  "MX Gold": "mxplayer.in",
  "Hungama OTT": "hungama.com",
  "Kable One": "kableone.com",
  "Hilal Play": "hilalplay.com",
  "Lionsgate Play": "lionsgateplay.com",
  "Eros Now": "erosnow.com",
  "Rakuten Viki": "viki.com",
  "Discovery+": "discoveryplus.com",
  "Chaupal": "chaupal.tv",
  "ShemarooMe": "shemaroome.com",
  "ALTBalaji": "altt.co.in",
  "Ullu": "ullu.app",
  "Atrangii": "atrangii.in",
  "PrimeShots": "primeshots.app",
  "Vivamax": "vivamax.net",
  "Tapmad": "tapmad.com",
  "Hotspot Shield": "hotspotshield.com",
  "Jenni AI": "jenni.ai",
  "Muse AI": "muse.ai",
  "HeyGen": "heygen.com",
  "Higgsfield": "higgsfield.ai",
};

const sourcePath = path.join(process.cwd(), "src/lib/ppds-catalog.ts");
const source = await readFile(sourcePath, "utf8");
const groups = [...source.matchAll(/services:\s*\[([^\]]+)\]/g)];
const services = groups.flatMap((group) =>
  [...group[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]),
);
const outputDirectory = path.join(process.cwd(), "public", "products", "catalog");

function slugify(value) {
  return value.toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[character]);
}

function initials(value) {
  const ignored = new Set(["ai", "iptv", "ott", "premium", "pro", "tv", "vpn"]);
  const words = value.split(/[^a-zA-Z0-9]+/).filter((word) => word && !ignored.has(word.toLowerCase()));
  if (words.length > 1) return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (words[0]?.slice(0, 2) ?? "PP").toUpperCase();
}

function monogramSvg(service) {
  const hue = [...service].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${escapeXml(service)}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 78% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 42) % 360} 74% 34%)"/></linearGradient></defs><rect width="128" height="128" rx="28" fill="url(#g)"/><text x="64" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="white">${initials(service)}</text></svg>`;
}

const responseCache = new Map();

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(url) {
  if (!responseCache.has(url)) {
    responseCache.set(url, (async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await fetch(url);
        if (response.ok) return response;
        if (response.status !== 429 || attempt === 4) throw new Error(`${response.status} ${url}`);
        await wait(1_500 * (attempt + 1));
      }
    })());
  }
  return (await responseCache.get(url)).clone();
}

async function downloadText(url) {
  return (await request(url)).text();
}

async function downloadBytes(url) {
  const response = await request(url);
  return { bytes: Buffer.from(await response.arrayBuffer()), type: response.headers.get("content-type") ?? "image/png" };
}

const collectionCache = new Map();

async function loadCollection(collection) {
  if (!collectionCache.has(collection)) {
    const url = `https://unpkg.com/@iconify-json/${collection}@latest/icons.json`;
    collectionCache.set(collection, (async () => ({ url, data: JSON.parse(await downloadText(url)) }))());
  }
  return collectionCache.get(collection);
}

async function downloadIcon(collection, name) {
  const { url, data } = await loadCollection(collection);
  const icon = data.icons?.[name];
  if (!icon) throw new Error(`Missing ${collection}:${name}`);
  const left = icon.left ?? 0;
  const top = icon.top ?? 0;
  const width = icon.width ?? data.width ?? data.height ?? 24;
  const height = icon.height ?? data.height ?? data.width ?? 24;
  return {
    sourceUrl: `${url}#${name}`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">${icon.body}</svg>`,
  };
}

await mkdir(outputDirectory, { recursive: true });
const manifest = [];

for (const service of services) {
  let svg;
  let sourceUrl;
  let sourceType;
  const icon = iconify[service];
  const domain = faviconDomains[service];

  try {
    if (icon) {
      const [collection, name] = icon.split(":");
      const downloaded = await downloadIcon(collection, name);
      sourceUrl = downloaded.sourceUrl;
      svg = downloaded.svg;
      if (!svg.includes("<svg") || /<script|onload\s*=/i.test(svg)) throw new Error(`Unsafe SVG for ${service}`);
      sourceType = "iconify";
    } else if (domain) {
      sourceUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
      const { bytes, type } = await downloadBytes(sourceUrl);
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:${type};base64,${bytes.toString("base64")}"/></svg>`;
      sourceType = "official-site-favicon";
    }
  } catch (error) {
    console.warn(`${service}: ${error.message}; using monogram.`);
  }

  if (!svg) {
    svg = monogramSvg(service);
    sourceUrl = null;
    sourceType = "generated-monogram";
  }

  const fileName = `${slugify(service)}.svg`;
  await writeFile(path.join(outputDirectory, fileName), `${svg.trim()}\n`);
  manifest.push({ service, file: fileName, sourceType, sourceUrl });
}

await writeFile(path.join(outputDirectory, "sources.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const sourced = manifest.filter(({ sourceType }) => sourceType !== "generated-monogram").length;
console.log(`Created ${manifest.length} local catalogue logos (${sourced} sourced, ${manifest.length - sourced} monograms).`);
