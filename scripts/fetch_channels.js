import fs from "fs";
import path from "path";
import https from "https";

/**
 * Paths
 */
const RAW_DIR = "data/raw";
const OUTPUT = "src/data/channels.json";

/**
 * Sources
 */
const SOURCES = {
  IPTV_ORG_IN:
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u",
  LIVETVCOLLECTOR_IN:
    "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV"
};

/* ---------- helpers ---------- */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed ${url} (${res.statusCode})`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function read(file) {
  return fs.readFileSync(file, "utf-8");
}

/* ---------- parsers ---------- */

function parseM3U(content) {
  const lines = content.split("\n");
  const out = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const name = line.split(",").pop()?.trim();
      current = { name, category: "General", source: "iptv-org" };
    } else if (line.startsWith("http") && current) {
      out.push({ ...current, url: line.trim() });
      current = null;
    }
  }
  return out;
}

function parseLiveTVCollector(content) {
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((ch) => ({
    name: ch.name || "Unknown",
    url: ch.url,
    category: "General",
    source: "LiveTVCollector"
  }));
}

/* ---------- normalize ---------- */

function normalize(list) {
  const seen = new Set();
  const out = [];

  for (const ch of list) {
    if (!ch.url || seen.has(ch.url)) continue;
    seen.add(ch.url);

    out.push({
      id: out.length + 1,
      name: ch.name,
      category: ch.category,
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      source: ch.source,
      status: "unknown"
    });
  }
  return out;
}

/* ---------- main ---------- */

async function main() {
  console.log("▶ Fetching + parsing IPTV sources...");

  ensureDir(RAW_DIR);
  ensureDir(path.dirname(OUTPUT));

  // Fetch
  for (const [name, url] of Object.entries(SOURCES)) {
    const dest = path.join(RAW_DIR, `${name}.txt`);
    await download(url, dest);
  }

  // Parse
  const iptvRaw = read(path.join(RAW_DIR, "IPTV_ORG_IN.txt"));
  const liveRaw = read(path.join(RAW_DIR, "LIVETVCOLLECTOR_IN.txt"));

  const channels = normalize([
    ...parseM3U(iptvRaw),
    ...parseLiveTVCollector(liveRaw)
  ]);

  fs.writeFileSync(OUTPUT, JSON.stringify(channels, null, 2));

  console.log(`✔ channels.json generated (${channels.length} channels)`);
}

main().catch((err) => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
