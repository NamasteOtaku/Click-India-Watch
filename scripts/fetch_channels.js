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

/* ================= FILTERS ================= */

// Expand carefully – not everything
const ALLOWED_KEYWORDS = [
  "aaj",
  "abp",
  "india",
  "republic",
  "news",
  "zee",
  "ndtv",
  "sony",
  "star",
  "colors",
  "sahara",
  "dd "
];

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
    .filter((ch) => ch.name && ch.url)
    .map((ch) => ({
      name: ch.name.trim(),
      url: ch.url.trim(),
      source: "LiveTVCollector"
    }));
}

/* ================= NORMALIZE ================= */

function normalize(list) {
  const seen = new Set();
  const out = [];

  for (const ch of list) {
    const key = ch.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: out.length + 1,
      name: ch.name,
      url: ch.url,
      category: "General",
      protocol: ch.url.startsWith("https") ? "https" : "http",
      source: ch.source,
      status: "unknown"
    });
  }
  return out;
}

/* ================= MAIN ================= */

async function main() {
  console.log("▶ Fetching IPTV sources (expanded)…");

  ensureDir(OUTPUT_DIR);

  const [iptvRes, collectorRes] = await Promise.all([
    fetch(IPTV_ORG_IN),
    fetch(LIVETV_COLLECTOR_IN)
  ]);

  const iptvRaw = await iptvRes.text();
  const collectorRaw = await collectorRes.text();

  const iptvChannels = parseM3U(iptvRaw);
  const collectorChannels = parseLiveTVCollector(collectorRaw);

  const merged = [...iptvChannels, ...collectorChannels];

  // Controlled expansion
  const filtered = merged.filter((ch) =>
    ALLOWED_KEYWORDS.some((k) =>
      ch.name.toLowerCase().includes(k)
    )
  );

  const finalChannels = normalize(filtered);

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(finalChannels, null, 2),
    "utf-8"
  );

  console.log(
    `✔ channels.json generated (${finalChannels.length} channels)`
  );
}

main().catch((err) => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
