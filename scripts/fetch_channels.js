import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/* ================= PATHS ================= */

const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "channels.json");
const CACHE_FILE = "data/health-cache.json";

/* ================= CONFIG ================= */

const HEALTH_TTL = 1000 * 60 * 60 * 12; // 12 hours

const IPTV_ORG_IN =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

const LIVETV_COLLECTOR_IN =
  "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV";

/* ================= CATEGORY DEFINITIONS ================= */

const CATEGORY_RULES = [
  { cat: "Adult (18+)", keys: ["adult", "xxx", "porn", "18+"] },
  { cat: "Radio & Audio-only", keys: ["radio", "fm", "music radio"] },

  { cat: "International & English News", keys: [
    "bbc","cnn","dw","france 24","al jazeera","trt","sky news",
    "cgtn","cna","global news","iran international"
  ]},

  { cat: "News", keys: [
    "news","aaj","abp","zee","ndtv","india today","republic",
    "news18","tv9","times now","wion","cnbc","et now",
    "manorama news","mathrubhumi","asianet news","sakshi tv",
    "ntv","kalinga","odisha tv","dy365","pratidin","goa365"
  ]},

  { cat: "Sports & Live Sports", keys: [
    "sport","sports","star sports","sony ten","dd sports",
    "fifa","t sports","psn","arena sport","euro","espn",
    "redbull","ptv sports"
  ]},

  { cat: "Movies & Cinema", keys: [
    "movie","movies","cinema","goldmines","b4u movies",
    "zee cinema","sony max","star gold","bollywood",
    "action","romedy","flix","mnx"
  ]},

  { cat: "Kids & Cartoon", keys: [
    "kids","cartoon","nick","disney","cbeebies",
    "sonic","hungama","shinchan","doraemon","duck tv"
  ]},

  { cat: "Music", keys: [
    "music","9x","9xm","b4u music","sangeet",
    "yrf","zing","mh 1","raj musix","surya music"
  ]},

  { cat: "Devotional & Spiritual", keys: [
    "aastha","bhakti","sanskar","satsang","god tv",
    "peace tv","madani","makkah","quran","azan",
    "angel tv","shalom","shekinah","svbc","jinvani"
  ]},

  { cat: "General Entertainment", keys: [
    "sony","sab","colors","star plus","sun tv","surya",
    "gemini","udaya","zee tv","&tv","asianet",
    "kairali","jaya tv","polimer","makal tv"
  ]},

  { cat: "Infotainment & Knowledge", keys: [
    "discovery","nat geo","national geographic",
    "history","travel","travelxp","food","food food",
    "bbc earth","sony bbc earth","wild","nature"
  ]}
];

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  ensureDir(path.dirname(CACHE_FILE));
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/hd|sd|uhd|fhd|\d+p/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function detectCategory(name = "") {
  const n = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some(k => n.includes(k))) return rule.cat;
  }
  return "Others";
}

function parseM3U(content) {
  const lines = content.split("\n");
  const out = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      current = line.split(",").pop()?.trim();
    } else if (line.startsWith("http") && current) {
      out.push({ name: current, url: line.trim(), source: "iptv-org" });
      current = null;
    }
  }
  return out;
}

function parseLiveTVCollector(text) {
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  if (!Array.isArray(data)) return [];
  return data
    .filter(ch => ch.name && ch.url)
    .map(ch => ({
      name: ch.name.trim(),
      url: ch.url.trim(),
      source: "LiveTVCollector"
    }));
}

async function checkHealth(url, cache) {
  if (!url.startsWith("https")) {
    return { status: "vlc", checkedAt: Date.now() };
  }

  const cached = cache[url];
  if (cached && Date.now() - cached.checkedAt < HEALTH_TTL) {
    return cached;
  }

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      timeout: 5000
    });
    return { status: res.ok ? "live" : "dead", checkedAt: Date.now() };
  } catch {
    return { status: "dead", checkedAt: Date.now() };
  }
}

/* ================= MAIN ================= */

async function main() {
  console.log("▶ Fetching & normalizing IPTV data (strict rules)…");

  ensureDir(OUTPUT_DIR);
  const healthCache = loadCache();

  const [iptvRes, collectorRes] = await Promise.all([
    fetch(IPTV_ORG_IN),
    fetch(LIVETV_COLLECTOR_IN)
  ]);

  const merged = [
    ...parseM3U(await iptvRes.text()),
    ...parseLiveTVCollector(await collectorRes.text())
  ];

  const map = {};

  for (const ch of merged) {
    const key = normalizeName(ch.name);
    if (!key || !ch.url) continue;

    if (!map[key]) {
      map[key] = {
        name: ch.name,
        category: detectCategory(ch.name),
        sources: []
      };
    }

    const health = await checkHealth(ch.url, healthCache);
    healthCache[ch.url] = health;

    map[key].sources.push({
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      status: health.status,
      source: ch.source
    });
  }

  const finalChannels = Object.values(map).map((c, i) => ({
    id: i + 1,
    name: c.name,
    category: c.category,
    sources: c.sources
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalChannels, null, 2));
  saveCache(healthCache);

  console.log(`✔ channels.json generated (${finalChannels.length} channels)`);
}

main().catch(err => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
