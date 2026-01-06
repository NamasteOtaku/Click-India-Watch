import fs from "fs";
import path from "path";

/**
 * Paths
 */
const RAW_DIR = "data/raw";
const OUTPUT = "src/data/channels.json";

/**
 * Helpers
 */
function read(file) {
  return fs.readFileSync(file, "utf-8");
}

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/**
 * Parse IPTV-ORG M3U
 */
function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];

  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)$/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : "Unknown",
        category: "General",
        source: "iptv-org"
      };
    } else if (line.startsWith("http") && current) {
      channels.push({
        ...current,
        url: line.trim()
      });
      current = null;
    }
  }

  return channels;
}

/**
 * Parse LiveTVCollector JSON
 */
function parseLiveTVCollector(content) {
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    name: item.name || "Unknown",
    category: "General",
    url: item.url,
    source: "LiveTVCollector"
  }));
}

/**
 * Normalize
 */
function normalize(channels) {
  const seen = new Set();
  const result = [];

  for (const ch of channels) {
    if (!ch.url || seen.has(ch.url)) continue;
    seen.add(ch.url);

    result.push({
      id: result.length + 1,
      name: ch.name,
      category: ch.category,
      url: ch.url,
      protocol: ch.url.startsWith("https") ? "https" : "http",
      source: ch.source,
      status: "unknown"
    });
  }

  return result;
}

/**
 * MAIN
 */
function main() {
  console.log("▶ Parsing IPTV sources...");

  const iptvRaw = read(path.join(RAW_DIR, "IPTV_ORG_IN.txt"));
  const liveTvRaw = read(
    path.join(RAW_DIR, "LIVETVCOLLECTOR_IN.txt")
  );

  const iptvChannels = parseM3U(iptvRaw);
  const liveTvChannels = parseLiveTVCollector(liveTvRaw);

  const allChannels = normalize([
    ...iptvChannels,
    ...liveTvChannels
  ]);

  write(OUTPUT, allChannels);

  console.log(
    `✔ Generated channels.json (${allChannels.length} channels)`
  );
}

main();
