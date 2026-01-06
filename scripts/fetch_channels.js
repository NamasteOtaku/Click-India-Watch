import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT = path.resolve("data/channels.json");

// 🔧 CONFIG — only channels you want
const ALLOWED = [
  "Aaj Tak",
  "ABP News",
  "India TV",
  "Republic Bharat",
  "News18 India"
];

// 🔴 LiveTVCollector source (raw playlist)
const SOURCE =
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u";

// ---- Helpers ----
function parseM3U(text) {
  const lines = text.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",").pop()?.trim();
      const url = lines[i + 1]?.trim();
      if (name && url) {
        channels.push({ name, url });
      }
    }
  }
  return channels;
}

// ---- MAIN ----
(async () => {
  console.log("Fetching LiveTVCollector data…");

  const res = await fetch(SOURCE);
  const raw = await res.text();

  const parsed = parseM3U(raw);

  const filtered = parsed.filter((c) =>
    ALLOWED.some((a) => c.name.toLowerCase().includes(a.toLowerCase()))
  );

  const finalData = filtered.map((c, i) => ({
    id: i + 1,
    name: c.name,
    url: c.url,
    category: "News",
    active: true
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(finalData, null, 2));
  console.log(`Updated ${finalData.length} channels.`);
})();
