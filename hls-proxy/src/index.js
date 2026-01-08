export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url");

    if (!target || !target.startsWith("http")) {
      return new Response("Missing ?url=", { status: 400 });
    }

    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
        "Referer": "https://click-india-watch.pages.dev/",
        "Accept": "*/*"
      }
    });

    let body = await upstream.text();

    // Rewrite HLS segment URLs to go through proxy
    if (body.includes("#EXTM3U")) {
      const base = new URL(target);
      body = body.replace(
        /(?!#)([^"\n\r]+\.ts|[^"\n\r]+\.m3u8)/g,
        (line) => {
          if (line.startsWith("http")) {
            return `${new URL(request.url).origin}/?url=${encodeURIComponent(line)}`;
          }
          return `${new URL(request.url).origin}/?url=${encodeURIComponent(
            new URL(line, base).href
          )}`;
        }
      );
    }

    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
};