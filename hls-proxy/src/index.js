export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target || !target.startsWith("http")) {
      return new Response("Missing or invalid ?url=", { status: 400 });
    }

    const upstreamRequest = new Request(target, {
      method: request.method,
      headers: {
        "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
        "Referer": "https://click-india-watch.pages.dev/",
      },
    });

    const response = await fetch(upstreamRequest);

    // Handle HLS playlists
    if (target.includes(".m3u8")) {
      let playlist = await response.text();
      const proxyBase = `${url.origin}${url.pathname}?url=`;

      playlist = playlist.replace(
        /(https?:\/\/[^\s"'#]+)/g,
        (m) => `${proxyBase}${encodeURIComponent(m)}`
      );

      return new Response(playlist, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Handle TS segments
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};