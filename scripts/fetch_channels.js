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

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function inferCategory(name = "") {
  const n = name.toLowerCase();
  if (n.includes("news")) return "News";
  if (n.includes("sport")) return "Sports";
  if (n.includes("movie") || n.includes("cinema")) return "Movies";
  if (n.includes("kids") || n.includes("cartoon")) return "Kids";
  if (n.includes("music")) return "Music";
  return "Entertainment";
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
  console.log("▶ Fetching & checking IPTV sources…");

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
      category: inferCategory(ch.name),
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
