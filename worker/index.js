export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      if (url.pathname !== "/api/stream") {
        return new Response("Not Found", { status: 404 })
      }

      const channelName = url.searchParams.get("channel")
      if (!channelName) {
        return json({ error: "Missing channel parameter" }, 400)
      }

      const channels = await loadChannels(env)
      const channel = channels.find(
        c => c.name.toLowerCase() === channelName.toLowerCase()
      )

      if (!channel) {
        return json({ error: "Channel not found" }, 404)
      }

      const source = selectSource(channel)
      if (!source) {
        return json({ error: "No live sources available" }, 503)
      }

      if (source.playable === "vlc") {
        return json({
          status: "pending",
          message: "This stream requires conversion. Browser playback not available yet."
        }, 200)
      }

      return await proxyHLS(source.url, request)

    } catch (err) {
      console.error("STREAM_ERROR", err)
      return json({ error: "Internal streaming error" }, 500)
    }
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}

async function loadChannels(env) {
  const res = await fetch(env.CHANNELS_URL)
  if (!res.ok) throw new Error("Failed to load channels.json")
  return res.json()
}

function selectSource(channel) {
  return channel.sources.find(s => s.status === "live") || null
}

async function proxyHLS(targetUrl, clientRequest) {
  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 IPTV-Edge",
      "Referer": new URL(targetUrl).origin
    }
  })

  if (!res.ok) {
    throw new Error("Upstream fetch failed: " + res.status)
  }

  const contentType = res.headers.get("Content-Type") || ""

  if (contentType.includes("application/vnd.apple.mpegurl") || targetUrl.endsWith(".m3u8")) {
    const text = await res.text()
    const rewritten = rewritePlaylist(text, clientRequest)
    return new Response(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    })
  }

  // TS segment proxy
  return new Response(res.body, {
    headers: {
      "Content-Type": "video/mp2t",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30"
    }
  })
}

function rewritePlaylist(playlist, clientRequest) {
  const base = new URL(clientRequest.url).origin

  return playlist
    .split("\n")
    .map(line => {
      if (!line || line.startsWith("#")) return line
      const encoded = encodeURIComponent(line)
      return `${base}/api/segment?url=${encoded}`
    })
    .join("\n")
}