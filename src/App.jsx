import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

/* 🔒 DO NOT TOUCH LAYOUT / CSS 🔒 */

/* ✅ YOUR DEPLOYED WORKER URL */
const PROXY = "https://hls-proxy.intabdipanshu.workers.dev/?url=";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [current, setCurrent] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");

  const categories = ["All", ...new Set(channels.map(c => c.category))];
  const languages = ["All", ...new Set(channels.map(c => c.language))];

  const filtered = channels
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter(c => category === "All" || c.category === category)
    .filter(c => language === "All" || c.language === language);

  useEffect(() => {
    if (!current || !current.sources || current.sources.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    /* 🔥 CLEAN UP OLD PLAYER */
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.pause();
    video.removeAttribute("src");
    video.load();

    /* ✅ PICK FIRST PLAYABLE SOURCE */
    const playable =
      current.sources.find(s => s.protocol === "https") ||
      current.sources.find(s => s.protocol === "http");

    if (!playable) {
      console.warn("No playable source for", current.name);
      return;
    }

    const proxiedUrl = `${PROXY}${encodeURIComponent(playable.url)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error", data);
      });

      hlsRef.current = hls;
    } else {
      video.src = proxiedUrl;
    }
  }, [current]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>ClickNWatch</h2>

        <input
          placeholder="Search channels…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {languages.map(l => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <div className="channel-list">
          {filtered.map(ch => (
            <button
              key={ch.name}
              onClick={() => setCurrent(ch)}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="player-area">
        <div className="player-wrapper">
          {!current && (
            <div className="placeholder">Select a channel</div>
          )}
          <video
            ref={videoRef}
            className="player"
            controls
            autoPlay
            muted
          />
        </div>
      </main>
    </div>
  );
}