import { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const adLoadedRef = useRef(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [current, setCurrent] = useState(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* -------- CLEAN CHANNEL DATA -------- */
  const cleanChannels = channels.filter(
    c => c && c.name && c.name.trim().length > 1
  );

  const categories = ["All", ...new Set(cleanChannels.map(c => c.category))];

  const filtered = cleanChannels
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter(c => category === "All" || c.category === category);

  /* -------- PLAYER LOGIC -------- */
  useEffect(() => {
    if (!current) return;

    const playable = current.sources.filter(
      s => s.protocol === "https" && s.status === "live"
    );

    if (!playable[sourceIndex]) return;

    if (hlsRef.current) hlsRef.current.destroy();

    const hls = new Hls();
    hls.loadSource(playable[sourceIndex].url);
    hls.attachMedia(videoRef.current);
    hlsRef.current = hls;

    hls.on(Hls.Events.ERROR, () => {
      setSourceIndex(i => i + 1);
    });
  }, [current, sourceIndex]);

  /* -------- ADSTERRA NATIVE AD (SAFE LOAD) -------- */
  useEffect(() => {
    if (adLoadedRef.current) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl28421553.effectivegatecpm.com/fb94153b3dce2ffda9a4fa97861e9c0b/invoke.js";

    document.body.appendChild(script);
    adLoadedRef.current = true;
  }, []);

  return (
    <div className="app">
      {/* TOP BAR */}
      <header className="topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        <h1>ClickNWatch</h1>
      </header>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <button className="close" onClick={() => setSidebarOpen(false)}>
            ×
          </button>

          <input
            className="search"
            placeholder="Search channels…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <select
            className="select"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="channel-list">
            {filtered.map(ch => (
              <button
                key={ch.name}
                className={current?.name === ch.name ? "active" : ""}
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

        {/* MAIN CONTENT */}
        <main className="main">
          {/* PLAYER (FIXED SIZE, NO JUMP) */}
          <div className="player-wrapper">
            {!current && <div className="placeholder">Select a channel</div>}
            <video
              ref={videoRef}
              controls
              autoPlay
              muted
              className="player"
            />
          </div>

          {/* ADSTERRA NATIVE CONTAINER */}
          <div className="ad-native">
            <div id="container-fb94153b3dce2ffda9a4fa97861e9c0b"></div>
          </div>
        </main>
      </div>
    </div>
  );
}