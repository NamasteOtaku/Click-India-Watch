import { useState, useRef, useEffect } from "react";
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
  const [sourceIndex, setSourceIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = ["All", ...new Set(channels.map(c => c.category))];
  const languages = ["All", ...new Set(channels.map(c => c.language))];

  const filtered = channels
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter(c => category === "All" || c.category === category)
    .filter(c => language === "All" || c.language === language);

  /* ================= PLAYBACK ================= */

  useEffect(() => {
    if (!current || !videoRef.current) return;

    const video = videoRef.current;

    // PRIORITY-BASED SOURCE SELECTION
    const sources =
      current.sources
        ?.slice()
        ?.sort((a, b) => {
          if (a.protocol === "https" && a.status === "live") return -1;
          if (b.protocol === "https" && b.status === "live") return 1;
          if (a.protocol === "https") return -1;
          if (b.protocol === "https") return 1;
          return 0;
        }) || [];

    if (!sources[sourceIndex]) {
      console.warn("No playable source found", current.name);
      return;
    }

    const url = sources[sourceIndex].url;

    // CLEANUP OLD PLAYER
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveDurationInfinity: true,
        enableWorker: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        setSourceIndex(i => i + 1);
      });

      hlsRef.current = hls;
    } else {
      // SAFARI / NATIVE
      video.src = url;
    }

    video.play().catch(() => {});
  }, [current, sourceIndex]);

  /* ================= UI ================= */

  return (
    <div className="app-root">
      <header className="app-header">
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(v => !v)}
        >
          ☰
        </button>
        <h1>ClickNWatch</h1>
      </header>

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
                onClick={() => {
                  setCurrent(ch);
                  setSourceIndex(0);
                  setSidebarOpen(false);
                }}
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
    </div>
  );
}