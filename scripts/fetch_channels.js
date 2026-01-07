import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/* ================= PATHS ================= */

const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "channels.json");
const CACHE_FILE = "data/health-cache.json";

/* ================= CONFIG ================= */

const HEALTH_TTL = 1000 * 60 * 60 * 12;

const IPTV_ORG_IN =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

const LIVETV_COLLECTOR_IN =
  "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV";

/* ================= UPDATED CATEGORY RULES ================= */
/* ✅ Updated to match exact categories from previous categorization
   ✅ Added more comprehensive keywords from your channel list
   ✅ Added optional Regional Pack rules (commented out - uncomment to enable)
   ✅ Priority order: Adult > Radio > News > Sports > Movies > Kids > Music > Devotional > GEC > Infotainment > Regional */

const CATEGORY_RULES = [
  // 🔒 Adult (18+) - First priority
  { cat: "Adult (18+)", keys: ["adult","xxx","porn","18+","pronpros","private","porn hub","boys tube","falconcast"] },
  
  // 📻 Radio & Audio-only
  { cat: "Radio & Audio-only", keys: ["radio","fm","audio","স্পাইস"] },
  
  // 🌍 International & English News
  { cat: "International & English News", keys: ["bbc","cnn","dw","al jazeera","trt","sky news","france 24","fox news","cgtn","cna","global news","iran international","rt news","news max"] },
  
  // 📰 News (National + Regional)
  { cat: "News", keys: ["news","aaj","abp","zee news","ndtv","republic","news18","tv9","india tv","bharat24","india news","news nation","news x","times now","mirror now","sudarshan","sandesh","samachar","news live","news9live","wion","news7","thanthi","manorama","mathrubhumi","asianet news","kairali","media one","sakshi","ntv","tv5 news","odisha tv","kalinga","prudent","goa365","dy365","prag news"] },
  
  // ⚽ Sports & Live Sports
  { cat: "Sports & Live Sports", keys: ["sport","sports","star sports","star sports select","sony sports","sony ten","dd sports","fifa","psn","bein sports","euro sports","tn t sports","ptv sports","a sports","jio sport","bpl","t sports","ilt20","redbull","russia football","arena sport","nova sport","sharjah sports","pro sport"] },
  
  // 🎬 Movies & Cinema
  { cat: "Movies & Cinema", keys: ["movie","movies","cinema","goldmines","b4u","bhojpuri cinema","filamchi","oscar movies","anmol cinema","abzy movies","manoranjan movies","zee cinema","zee bollywood","zee classic","zee action","zee chitramandir","zee cine classic","star gold","star movies","star utsav movies","sony max","tata sky bollywood","wow cinema","hinde movies","bollywood","sheemaroo","movie bangla","tara bangla cinema","utsav gold","action hollywood"] },
  
  // 👶 Kids & Cartoon
  { cat: "Kids & Cartoon", keys: ["kids","cartoon","nick","nickelodeon","nick jr","disney","hungama","sonic","chutti","kochu","chintu","captain","super hungama","shinchan","doraemon","pbs kids","bbc cbeebies","duck tv","zoo moo","jungle book","toonz kids","kids zone"] },
  
  // 🎵 Music
  { cat: "Music", keys: ["music","9x","9xm","9x jalwa","9x jhakaas","9x tashan","b4u music","sangeet","sangeet bangla","sangeet marathi","sangeet bhojpuri","yrf","raj musix","punjabi hits","songdew","zing","udaya music","surya music","mh 1 music"] },
  
  // 🛕 Devotional & Spiritual
  { cat: "Devotional & Spiritual", keys: ["aastha","aastha bhajan","aastha kannada","aastha tamil","aastha telugu","aastha gujarati","sanskar","satsang","bhakthi","bhakti","svbc","god tv","peace tv","madani","makkah","makka","al sunnah","live quran","angel tv","shalom","shekinah","mercy tv","salvation tv","good news","harvest","hebron","sadhna","ishwar bhakti","total bhakti","om tv","jinvani","vedic","awakening tv"] },
  
  // 📺 General Entertainment (GEC / Serials)
  { cat: "General Entertainment (GEC / Serials)", keys: ["sony","sab","sony sab","sony pal","colors","star plus","star bharat","star maa","sun tv","surya tv","zee tv","&tv","gemini","udaya","asianet","jaya","polimer","makkal tv","mazhavil manorama","kairali tv","sirippoli","adithya","raj tv","vendhar","roja tv"] },
  
  // 📚 Infotainment & Knowledge
  { cat: "Infotainment & Knowledge", keys: ["discovery","nat geo","national geographic","history tv18","bbc earth","sony bbc earth","travelxp","travel xp","travel channel","food","food network","food food","dmax","wild earth","drone tv","epic tv"] },

  /* ========== OPTIONAL: REGIONAL LANGUAGE PACKS ==========
     Uncomment these to create language/region-specific groups.
     Channels matching these will override the main category above.
     Great for Indian users who want Bangla Pack, Tamil Pack, etc.
  
  { cat: "Regional - Hindi Pack", keys: ["hindi","aaj","zee","ndtv india","india tv","bharat","sab","colors hindi","star plus","star bharat"] },
  { cat: "Regional - Bangla Pack", keys: ["bangla","bengal","kolkata","ananda","news18 bangla","zee 24 ghanta","r plus","calcutta news","enter10 bangla","sun bangla","aakash aath"] },
  { cat: "Regional - Tamil Pack", keys: ["tamil","sun tv","polimer","thanthi tv","jaya tv","makkal tv","puthiya thalaimurai","news7 tamil","vendhar tv","roja tv"] },
  { cat: "Regional - Telugu Pack", keys: ["telugu","gemini","etv telugu","star maa","tv9 telugu","sakshi tv","ntv telugu"] },
  { cat: "Regional - Malayalam Pack", keys: ["malayalam","asianet","manorama","mathrubhumi news","kairali","media one","mazhavil manorama"] },
  { cat: "Regional - Kannada Pack", keys: ["kannada","udaya","suvarna","colors kannada","zee kannada"] },
  { cat: "Regional - Marathi Pack", keys: ["marathi","majha","24 taas","saam","zee marathi","colors marathi"] },
  { cat: "Regional - Punjabi Pack", keys: ["punjabi","ptc","zee punjabi"] },
  ======================================================= */
];

/* ================= UPDATED LANGUAGE RULES ================= */
/* ✅ More comprehensive keywords matching your channel list
   ✅ Added more regional languages and specific channel keywords
   ✅ English now catches more international channels
   ✅ "Other" fallback for unclassified */

const LANGUAGE_RULES = [
  { lang: "Hindi", keys: ["hindi","aaj tak","zee","ndtv india","india tv","bharat24","india news","sab","colors","star plus","star bharat","sun neo"] },
  { lang: "Bangla", keys: ["bangla","bengal","kolkata","ananda","news18 bangla","zee 24 ghanta","r plus","calcutta news","enter10 bangla","sun bangla","aakash aath","tv9 bangla"] },
  { lang: "Tamil", keys: ["tamil","sun tv","polimer","thanthi tv","jaya tv","makkal tv","puthiya thalaimurai","news7 tamil","vendhar tv","roja tv","sirippoli"] },
  { lang: "Telugu", keys: ["telugu","gemini tv","etv telugu","star maa","tv9 telugu","sakshi tv","ntv telugu","v6 news"] },
  { lang: "Kannada", keys: ["kannada","udaya","suvarna","colors kannada","zee kannada","tv5 kannada"] },
  { lang: "Malayalam", keys: ["malayalam","asianet","manorama news","mathrubhumi news","kairali","media one","mazhavil manorama","surya tv"] },
  { lang: "Marathi", keys: ["marathi","majha","24 taas","saam tv","zee marathi","colors marathi","ndtv marathi"] },
  { lang: "Punjabi", keys: ["punjabi","ptc","zee punjabi","punjabi hits"] },
  { lang: "Odia", keys: ["odia","odisha tv","news18 odia"] },
  { lang: "Gujarati", keys: ["gujarati","zee gujarati","news18 gujarati"] },
  { lang: "Bhojpuri", keys: ["bhojpuri","b4u bhojpuri","filamchi bhojpuri"] },
  { lang: "Urdu", keys: ["urdu","zee salaam","news18 urdu"] },
  { lang: "English", keys: ["english","bbc","cnn","dw","al jazeera","trt world","sky news","france 24","fox news","wion","newsx","discovery","nat geo"] },
  { lang: "Arabic", keys: ["arabic","al jazeera","makkah"] }
];

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")); }
  catch { return {}; }
}

function saveCache(cache) {
  ensureDir(path.dirname(CACHE_FILE));
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function normalizeName(name = "") {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/hd|sd|uhd|fhd|\d+p/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function detectCategory(name = "") {
  const n = name.toLowerCase();
  for (const r of CATEGORY_RULES) {
    if (r.keys.some(k => n.includes(k))) return r.cat;
  }
  return "Others";
}

function detectLanguage(name = "") {
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

function parseLiveTVCollector(text) {
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  if (!Array.isArray(data)) return [];
  return data.filter(c => c.name && c.url).map(c => ({
    name: c.name.trim(),
    url: c.url.trim(),
    source: "LiveTVCollector"
  }));
}

async function checkHealth(url, cache) {
  if (!url.startsWith("https")) {
    return { status: "vlc", checkedAt: Date.now() };
  }

  const cached = cache[url];
  if (cached && Date.now() - cached.checkedAt < HEALTH_TTL) return cached;

  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow", timeout: 5000 });
    return { status: r.ok ? "live" : "dead", checkedAt: Date.now() };
  } catch {
    return { status: "dead", checkedAt: Date.now() };
  }
}

/* ================= MAIN ================= */

async function main() {
  ensureDir(OUTPUT_DIR);
  const cache = loadCache();

  const [iptv, collector] = await Promise.all([
    fetch(IPTV_ORG_IN).then(r => r.text()),
    fetch(LIVETV_COLLECTOR_IN).then(r => r.text())
  ]);

  const merged = [...parseM3U(iptv), ...parseLiveTVCollector(collector)];
  const map = {};

  for (const ch of merged) {
    const key = normalizeName(ch.name);
    if (!key || !ch.url) continue;

    if (!map[key]) {
      map[key] = {
        name: ch.name,
        category: detectCategory(ch.name),
        language: detectLanguage(ch.name),
        sources: []
      };
    }

    const health = await checkHealth(ch.url, cache);
    cache[ch.url] = health;

    map[key].sources.push({
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      status: health.status,
      source: ch.source
    });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(Object.values(map), null, 2)
  );

  saveCache(cache);
  console.log("✔ channels.json updated with NEW category/language rules ✅");
  console.log("📁 Categories now match your preferred grouping:");
  console.log("- News, Movies, Sports, Kids, Music, Devotional, GEC, Infotainment");
  console.log("- Optional Regional Packs available (uncomment in code)");
  console.log(`📊 Processed ${Object.keys(map).length} unique channels`);
}

main();
