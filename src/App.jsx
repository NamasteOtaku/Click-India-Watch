import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("all");
  const [current, setCurrent] = useState(null);
  const [sourceIndex, setSourceIndex] = useState(0);

  const categories = ["All", ...new Set(channels.map(c => c.category))];

  const filteredChannels = channels
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    .filter(c => category === "All" || c.category === category)
    .filter(c =>
      sort === "all"
        ? true
        : sort === "live"
        ? c.sources.some(s => s.protocol === "https" && s.status === "live")
        : c.sources.some(s => s.protocol === "http")
    );

  useEffect(() => {
    if (!current) return;

    const sources = current.sources
      .filter(s => s.protocol === "https" && s.status === "live");

    if (!sources[sourceIndex]) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(sources[sourceIndex].url);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, () => {
        setSourceIndex(i => i + 1);
      });
    }
  }, [current, sourceIndex]);

  function selectChannel(ch) {
    setCurrent(ch);
    setSourceIndex(0);
  }

  const httpsSources = current?.sources.filter(s => s.protocol === "https" && s.status === "live") || [];
  const httpSources = current?.sources.filter(s => s.protocol === "http") || [];

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📺 ClickNWatch</h2>

        <input
          placeholder="Search channel…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <div className="sort-bar">
          <button onClick={() => setSort("all")}>All</button>
          <button onClick={() => setSort("live")}>LIVE</button>
          <button onClick={() => setSort("vlc")}>VLC</button>
        </div>

        <div className="channel-list">
          {filteredChannels.map(ch => (
            <button key={ch.id} className="channel-btn" onClick={() => selectChannel(ch)}>
              {ch.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="player-area">
        {!current && <div className="placeholder">Select a channel</div>}

        {httpsSources.length > 0 && (
          <video ref={videoRef} controls autoPlay muted className="player" />
        )}

        {httpsSources.length === 0 && httpSources.length > 0 && (
          <div className="vlc-box">
            <p>No browser-playable stream.</p>
            <input readOnly value={httpSources[0].url} />
            <small>Open in VLC / IPTV Player</small>
          </div>
        )}
      </main>
    </div>
  );
}
