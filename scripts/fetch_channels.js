import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/* ================= PATHS ================= */

const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "channels.json");

/* ================= SOURCES ================= */

const IPTV_ORG_IN =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

const LIVETV_COLLECTOR_IN =
  "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV";

/* ================= CATEGORY MAP ================= */

const CATEGORY_MAP = {
  "📰 News Channels": [
    "aaj tak","abp","india tv","republic","zee news","ndtv","news18",
    "times now","cnn","mirror now","newsx","wion","bbc","al jazeera",
    "france 24","dw","cgtn","fox","trt","iran"
  ],

  "🎬 Movie Channels": [
    "b4u","zee cinema","bolly","goldmines","dangal","wow cinema",
    "bollywood","roja","zee cine","dhamaka","filamchi","oscar movie"
  ],

  "🎵 Music Channels": [
    "9xm","9x","b4u music","music india","sangeet","ptc music",
    "shemaroo","songdew","yrf","dhoom","rtv music","beats","steelbird"
  ],

  "📺 General Entertainment Channels": [
    "colors","sony","&tv","raj tv","kalaignar","sun tv","surya",
    "gemini","mazhavil","kairali","manoranjan","enterr 10","amrita",
    "moon tv","makkal","tamilan","thalaa"
  ],

  "📚 Educational & Devotional Channels": [
    "gyandarshan","vyas","kite","dd bharati","aastha","sanskar",
    "satsang","bhakti","aradhana","angel","subhavaartha","salvation",
    "god tv","peace tv","madani","ishwar","total bhakti","svbc",
    "shalom","shekinah","aadinath"
  ],

  "🧒 Kids & Youth": [
    "gubbare","bal bharat","shinchan","doraemon","cbeebies",
    "duck tv","pbs kids","zoo moo","jungle book"
  ],

  "🌍 Travel, Nature & Lifestyle": [
    "travelxp","travel xp","safari","epic","bbc earth","wild earth",
    "4k travel","food network","food food","discover","pet collective",
    "weather","accu"
  ],

  "🎭 Comedy & Drama": [
    "comedy","etv comedy","etv josh","zee dil se","bongo","movie club",
    "hindi dubbing"
  ],

  "🕌 Islamic & Religious": [
    "makkah","islam","sunnah","azan","waz","quran","madani"
  ],

  "⚽ Sports Channels": [
    "dd sports","t sport","psn","redbull","real madrid","fifa",
    "rta sports","sharjah","pro sport"
  ],

  "🏛️ Government & Parliamentary": [
    "sansad","dd national","dd news","dd india","dd "
  ]
};

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function detectCategory(name = "") {
  const n = name.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => n.includes(k))) {
      return category;
    }
  }

  return "🧩 Others / Miscellaneous";
}

function parseM3U(content) {
  const lines = content.split("\n");
  const out = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      current = line.split(",").pop()?.trim();
    } else if (line.startsWith("http") && current) {
      out.push({
        name: current,
        url: line.trim(),
        source: "iptv-org"
      });
      current = null;
    }
  }
  return out;
}

function parseLiveTVCollector(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data
    .filter(ch => ch.name && ch.url)
    .map(ch => ({
      name: ch.name.trim(),
      url: ch.url.trim(),
      source: "LiveTVCollector"
    }));
}

async function checkHealth(url) {
  if (!url.startsWith("https")) return "vlc";

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      timeout: 5000
    });
    return res.ok ? "live" : "dead";
  } catch {
    return "dead";
  }
}

/* ================= MAIN ================= */

async function main() {
  console.log("▶ Fetching IPTV + LiveTVCollector (categorized)…");

  ensureDir(OUTPUT_DIR);

  const [iptvRes, collectorRes] = await Promise.all([
    fetch(IPTV_ORG_IN),
    fetch(LIVETV_COLLECTOR_IN)
  ]);

  const iptvRaw = await iptvRes.text();
  const collectorRaw = await collectorRes.text();

  const merged = [
    ...parseM3U(iptvRaw),
    ...parseLiveTVCollector(collectorRaw)
  ];

  const seen = new Set();
  const finalChannels = [];

  for (const ch of merged) {
    if (!ch.url || seen.has(ch.url)) continue;
    seen.add(ch.url);

    const status = await checkHealth(ch.url);

    finalChannels.push({
      id: finalChannels.length + 1,
      name: ch.name,
      url: ch.url,
      category: detectCategory(ch.name),
      protocol: ch.url.startsWith("https") ? "https" : "http",
      source: ch.source,
      status
    });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(finalChannels, null, 2),
    "utf-8"
  );

  console.log(`✔ channels.json generated (${finalChannels.length} channels)`);
}

main().catch(err => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
