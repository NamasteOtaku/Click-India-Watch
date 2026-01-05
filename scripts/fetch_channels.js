import fs from "fs";
import path from "path";
import https from "https";

const RAW_DIR = "data/raw";

const SOURCES = {
  IPTV_ORG_IN:
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u",
  LIVETVCOLLECTOR_IN:
    "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/India/LiveTV"
};

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
          reject(
            new Error(`Failed to fetch ${url} (${res.statusCode})`)
          );
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  ensureDir(RAW_DIR);

  console.log("▶ Fetching raw IPTV sources...");

  for (const [name, url] of Object.entries(SOURCES)) {
    const outFile = path.join(RAW_DIR, `${name}.txt`);
    console.log(`  → ${name}`);
    await download(url, outFile);
  }

  console.log("✔ Raw IPTV sources fetched successfully");
}

main().catch((err) => {
  console.error("✖ Fetch failed:", err.message);
  process.exit(1);
});
