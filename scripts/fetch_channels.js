import fs from "fs";
import path from "path";
import fetch from "node-fetch";

/* ================= CONFIG ================= */

const OUTPUT_DIR = "src/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "channels.json");

const IPTV_SOURCE =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

// Keep this list small & stable for now
const ALLOWED_KEYWORDS = [
  "aaj tak",
  "abp",
  "india tv",
  "republic",
  "news18",
  "zee news",
  "ndtv"
];

/* ================= HELPERS ================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",").pop()?.trim();
      const url = lines[i + 1]?.trim();

      if (name && url && url.startsWith("http")) {
        channels.push({ name, url });
      }
    }
  }

  return channels;
}

/* ================= MAIN ================= */

async function main() {
  console.log("▶ Fetching LiveTVCollector / IPTV data…");

  ensureDir(OUTPUT_DIR);

  const res = await fetch(IPTV_SOURCE);
  if (!res.ok) {
    throw new Error(`Failed to fetch IPTV source (${res.status})`);
  }

  const raw = await res.text();
  const parsed = parseM3U(raw);

  const filtered = parsed.filter((ch) =>
    ALLOWED_KEYWORDS.some((k) =>
      ch.name.toLowerCase().includes(k)
    )
  );

  const finalChannels = filtered.map((ch, index) => ({
    id: index + 1,
    name: ch.name,
    url: ch.url,
    category: "News",
    protocol: ch.url.startsWith("https") ? "https" : "http",
    source: "LiveTVCollector",
    status: "unknown"
  }));

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(finalChannels, null, 2),
    "utf-8"
  );

  console.log(`✔ channels.json generated (${finalChannels.length} channels)`);
}

main().catch((err) => {
  console.error("✖ Build failed:", err.message);
  process.exit(1);
});
