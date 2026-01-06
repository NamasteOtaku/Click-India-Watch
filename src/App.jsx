import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(null);

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!current || !videoRef.current) return;

    // Cleanup previous instance
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
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = current.url;
    }
  }, [current]);

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>📺 ClickNWatch</h2>

        <input
          type="text"
          placeholder="Search channel…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="channel-list">
          {filteredChannels.map((ch) => (
            <button
              key={ch.id}
              className={`channel-btn ${
                current?.id === ch.id ? "active" : ""
              }`}
              onClick={() => setCurrent(ch)}
            >
              {ch.name}
              <span className={`badge ${ch.protocol}`}>
                {ch.protocol === "https" ? "LIVE" : "VLC"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* PLAYER */}
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
            <p>
              <strong>{current.name}</strong>  
              <br />
              Not playable in browser
            </p>
            <input
              readOnly
              value={current.url}
              onFocus={(e) => e.target.select()}
            />
            <small>Open in VLC / IPTV Player</small>
          </div>
        )}
      </main>
    </div>
  );
}
