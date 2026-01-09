import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ["All", ...new Set(channels.map(c => c.category))];
  const languages = ["All", ...new Set(channels.map(c => c.language))];

  const filtered = channels.filter(ch =>
    ch.name.toLowerCase().includes(query.toLowerCase()) &&
    (category === "All" || ch.category === category) &&
    (language === "All" || ch.language === language)
  );

useEffect(() => {
  if (!current || !videoRef.current) return;

  const video = videoRef.current;

  // ✅ LIVE-ONLY sources
  const liveSources = (current.sources || []).filter(
    s => s.status === "live" && typeof s.url === "string"
  );

  if (liveSources.length === 0) {
    console.warn("No live sources available for this channel");
    return;
  }

  let index = 0;
  let hls;

  // Cleanup any previous instance
  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }

  // Reset video safely (DO NOT REMOVE ELEMENT)
  video.pause();
  video.removeAttribute("src");
  video.load();

  const playSource = () => {
    if (index >= liveSources.length) {
      console.error("All live sources failed for channel:", current.name);
      return;
    }

    const source = liveSources[index];
    const url = source.url;

    // SAFETY CHECK (prevents crash)
    if (typeof url !== "string") {
      index++;
      playSource();
      return;
    }

    // ---- HLS (.m3u8) ----
    if (Hls.isSupported() && url.includes(".m3u8")) {
      hls = new Hls({ debug: false });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, () => {
        hls.destroy();
        index++;
        playSource(); // 🔁 fallback (same channel)
      });

      hlsRef.current = hls;
    } 
    // ---- NON-HLS (mp4 / others) ----
    else {
      video.src = url;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
      video.onerror = () => {
        index++;
        playSource(); // 🔁 fallback
      };
    }
  };

  playSource();

  // Cleanup on channel change / unmount
  return () => {
    if (hls) {
      hls.destroy();
    }
  };
}, [current]);

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <h1 className="logo">ClickNWatch</h1>
        <input
          className="search"
          placeholder="Search channels…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </header>

      {/* PLAYER + ADS ROW */}
      <section className="player-row">
        <div className="ad-side">Ad Space</div>

        <div className="player-wrap">
          <video
            ref={videoRef}
            className="player"
            controls
            muted
            autoPlay
          />
          {loading && <div className="loading">Loading…</div>}
        </div>

        <div className="ad-side">Ad Space</div>
      </section>

      {/* FILTERS */}
      <section className="filters">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {languages.map(l => <option key={l}>{l}</option>)}
        </select>
      </section>

      {/* CHANNEL LIST (SCROLL ONLY HERE) */}
      <section className="channels-scroll">
        <div className="channels">
          {filtered.map(ch => (
            <button
              key={ch.name}
              className="channel"
              onClick={() => setCurrent(ch)}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}