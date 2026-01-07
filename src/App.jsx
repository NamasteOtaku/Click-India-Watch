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

  const categories = ["All", ...new Set(channels.map(c => c.category))];
  const languages = ["All", ...new Set(channels.map(c => c.language))];

  const filtered = channels
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter(c => category === "All" || c.category === category)
    .filter(c => language === "All" || c.language === language);

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

    hls.on(Hls.Events.ERROR, () => setSourceIndex(i => i + 1));
  }, [current, sourceIndex]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>ClickNWatch</h2>

        <input
          placeholder="Search…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {languages.map(l => <option key={l}>{l}</option>)}
        </select>

        <div className="channel-list">
          {filtered.map(ch => (
            <button key={ch.name} onClick={() => { setCurrent(ch); setSourceIndex(0); }}>
              {ch.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="player-area">
        {!current && <div className="placeholder">Select a channel</div>}
        {current && (
          <video ref={videoRef} controls autoPlay muted className="player" />
        )}
      </main>
    </div>
  );
}
