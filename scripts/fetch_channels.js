import fs from "fs";
import path from "path";

const DATA_DIR = "data";
const OUTPUT = path.join(DATA_DIR, "channels.json");

/**
 * SAFE SAMPLE SOURCE (HTTPS)
 * Will expand later
 */
const SOURCES = [
  {
    name: "4TV News",
    url: "https://cdn-4.pishow.tv/live/1007/master.m3u8",
    category: "News"
  },
  {
    name: "Aaj Tak",
    url: "https://cdn-1.pishow.tv/live/391/master.m3u8",
    category: "News"
  }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  ensureDir(DATA_DIR);

  const channels = SOURCES.map((c, i) => ({
    id: i + 1,
    name: c.name,
    category: c.category,
    url: c.url,
    protocol: c.url.startsWith("https") ? "https" : "http",
    status: "unknown"
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(channels, null, 2));
  console.log(`✔ channels.json generated (${channels.length} channels)`);
}

main();
