import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/* ========= PATHS ========= */
const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "channels.json");
const CACHE_FILE = "data/health-cache.json";

/* ========= SOURCES ========= */
const IPTV_ORG_IN =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

const LIVETV_COLLECTOR_IN =
  "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV";

/* ========= CATEGORY RULES ========= */
const CATEGORY_RULES = [
  { cat: "News", keys: ["news","aaj","abp","ndtv","zee news","republic","news18","tv9","india tv","wion","bbc","cnn","dw","al jazeera"] },
  { cat: "Movies & Cinema", keys: ["movie","movies","cinema","b4u","goldmines","bollywood","star gold","sony max","zee cinema"] },
  { cat: "Sports & Live Sports", keys: ["sport","sports","star sports","sony ten","dd sports","fifa","t sports"] },
  { cat: "Kids & Cartoon", keys: ["kids","cartoon","nick","disney","hungama","shinchan","doraemon"] },
  { cat: "Music", keys: ["music","9x","9xm","b4u music","sangeet","yrf"] },
  { cat: "Devotional & Spiritual", keys: ["aastha","sanskar","bhakti","god tv","peace tv","madani","makkah"] },
  { cat: "General Entertainment (GEC / Serials)", keys: ["sony","sab","colors","star plus","sun tv","zee tv","gemini","asianet"] },
  { cat: "Infotainment & Knowledge", keys: ["discovery","nat geo","history","bbc earth","travelxp"] },
  { cat: "Adult (18+)", keys: ["xxx","porn","18+"] },
  { cat: "Radio & Audio-only", keys: ["radio","fm"] }
];

/* ========= LANGUAGE RULES ========= */
const LANGUAGE_RULES = [
  { lang: "Hindi", keys: ["hindi","aaj","zee","ndtv","india tv","sab"] },
  { lang: "English", keys: ["bbc","cnn","dw","al jazeera","wion","discovery"] },
  { lang: "Bangla", keys: ["bangla","bengal","ananda"] },
  { lang: "Tamil", keys: ["tamil","sun","polimer"] },
  { lang: "Telugu", keys: ["telugu","gemini","etv"] },
  { lang: "Malayalam", keys: ["malayalam","asianet","manorama"] },
  { lang: "Kannada", keys: ["kannada","udaya"] },
  { lang: "Marathi", keys: ["marathi","majha","24 taas"] }
];

/* ========= HELPERS ========= */
function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/hd|sd|\d+p/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function detectCategory(name) {
  const n = name.toLowerCase();
  for (const r of CATEGORY_RULES) {
    if (r.keys.some(k => n.includes(k))) return r.cat;
  }
  return "Others";
}

function detectLanguage(name) {
  const n = name.toLowerCase();
  for (const r of LANGUAGE_RULES) {
    if (r.keys.some(k => n.includes(k))) return r.lang;
  }
  return "Other";
}

function parseM3U(text) {
  const lines = text.split("\n");
  const out = [];
  let current = null;

  for (const l of lines) {
    if (l.startsWith("#EXTINF")) {
      current = l.split(",").pop()?.trim();
    } else if (l.startsWith("http") && current) {
      out.push({ name: current, url: l.trim(), source: "iptv-org" });
      current = null;
    }
  }
  return out;
}

function parseCollector(text) {
  try {
    const json = JSON.parse(text);
    return json.map(c => ({
      name: c.name.trim(),
      url: c.url.trim(),
      source: "LiveTVCollector"
    }));
  } catch {
    return [];
  }
}

/* ========= MAIN ========= */
async function main() {
  ensureDir(OUTPUT_DIR);

  const [iptv, collector] = await Promise.all([
    fetch(IPTV_ORG_IN).then(r => r.text()),
    fetch(LIVETV_COLLECTOR_IN).then(r => r.text())
  ]);

  const raw = [...parseM3U(iptv), ...parseCollector(collector)];
  const map = {};

  for (const ch of raw) {
    if (!ch.name || !ch.url) continue;

    const key = normalizeName(ch.name);
    if (!map[key]) {
      map[key] = {
        name: ch.name,
        category: detectCategory(ch.name),
        language: detectLanguage(ch.name),
        sources: []
      };
    }

    map[key].sources.push({
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      status: ch.url.startsWith("https") ? "unknown" : "vlc",
      source: ch.source
    });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(Object.values(map), null, 2)
  );

  console.log(`✔ Generated ${Object.values(map).length} channels`);
}

main();