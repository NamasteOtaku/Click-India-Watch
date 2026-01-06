import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("all"); // all | live | vlc
  const [current, setCurrent] = useState(null);

  const categories = ["All", ...new Set(channels.map(c => c.category))];

  const filteredChannels = channels
    .filter(ch =>
      ch.name.toLowerCase().includes(query.toLowerCase())
    )
    .filter(ch =>
      category === "All" ? true : ch.category === category
    )
    .filter(ch =>
      sort === "all"
        ? true
        : sort === "live"
        ? ch.protocol === "https"
        : ch.protocol === "http"
    );

  useEffect(() => {
    if (!current || !videoRef.current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (current.protocol === "http") {
      videoRef.current.src = "";
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(current.url);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;
    } else if (
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      videoRef.current.src = current.url;
    }
  }, [current]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📺 ClickNWatch</h2>

        <input
          type="text"
          placeholder="Search channel…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="sort-bar">
          <button onClick={() => setSort("all")}>All</button>
          <button onClick={() => setSort("live")}>LIVE</button>
          <button onClick={() => setSort("vlc")}>VLC</button>
        </div>

        <div className="channel-list">
          {filteredChannels.map(ch => (
            <button
              key={ch.id}
              className={`channel-btn ${
                current?.id === ch.id ? "active" : ""
              }`}
              onClick={() => setCurrent(ch)}
            >
              <span>{ch.name}</span>
              <span className={`badge ${ch.protocol}`}>
                {ch.protocol === "https" ? "LIVE" : "VLC"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="player-area">
        {!current && (
          <div className="placeholder">
            Waiting for channel selection
          </div>
        )}

        {current?.protocol === "https" && (
          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            className="player"
          />
        )}

        {current?.protocol === "http" && (
          <div className="vlc-box">
            <p><strong>{current.name}</strong></p>
            <input
              readOnly
              value={current.url}
              onFocus={e => e.target.select()}
            />
            <small>Open this URL in VLC / IPTV Player</small>
          </div>
        )}
      </main>
    </div>
  );
}
