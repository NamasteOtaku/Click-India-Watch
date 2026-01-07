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

/* ================= CATEGORY MAP ================= */

const CATEGORY_MAP = {
  "📰 News Channels": ["news","aaj","abp","zee","ndtv","cnn","wion"],
  "🎬 Movie Channels": ["movie","cinema","b4u","bolly","goldmines"],
  "🎵 Music Channels": ["music","9x","b4u music","sangeet","yrf"],
  "📺 General Entertainment Channels": ["sony","colors","sun","star","tv"],
  "📚 Educational & Devotional Channels": ["bhakti","aastha","god","peace","dd"],
  "🧒 Kids & Youth": ["kids","cartoon","bal"],
  "🌍 Travel, Nature & Lifestyle": ["travel","food","wild","earth"],
  "🎭 Comedy & Drama": ["comedy","drama","bongo"],
  "🕌 Islamic & Religious": ["islam","quran","madani"],
  "⚽ Sports Channels": ["sport","fifa","dd sports"],
  "🏛️ Government & Parliamentary": ["sansad","dd national","dd news"]
};

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

function detectCategory(name = "") {
  const n = name.toLowerCase();
  for (const [cat, keys] of Object.entries(CATEGORY_MAP)) {
    if (keys.some(k => n.includes(k))) return cat;
  }
  return "🧩 Others / Miscellaneous";
}

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/hd|sd|fhd|uhd|\d+p/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
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

function parseLiveTVCollector(jsonText) {
  let data;
  try { data = JSON.parse(jsonText); } catch { return []; }
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
  console.log("▶ Fetching IPTV data with multi-source fallback…");

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

  const channelMap = {};

  for (const ch of merged) {
    const key = normalizeName(ch.name);
    if (!key || !ch.url) continue;

    if (!channelMap[key]) {
      channelMap[key] = {
        name: ch.name,
        category: detectCategory(ch.name),
        sources: []
      };
    }

    const health = await checkHealth(ch.url, healthCache);
    healthCache[ch.url] = health;

    channelMap[key].sources.push({
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      status: health.status,
      source: ch.source
    });
  }

  const finalChannels = Object.values(channelMap).map((ch, i) => ({
    id: i + 1,
    name: ch.name,
    category: ch.category,
    sources: ch.sources
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalChannels, null, 2));
  saveCache(healthCache);

  console.log(`✔ channels.json generated (${finalChannels.length} channels)`);
}

main().catch(err => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
