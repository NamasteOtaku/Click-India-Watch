import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import channels from "./data/channels.json";
import "./App.css";

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
    if (!current) return;

    const httpsLive = current.sources.find(
      s => s.protocol === "https"
    );

    if (!httpsLive) return;

    if (hlsRef.current) hlsRef.current.destroy();

    const hls = new Hls();
    hls.loadSource(httpsLive.url);
    hls.attachMedia(videoRef.current);
    hlsRef.current = hls;

    return () => hls.destroy();
  }, [current]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <input
          placeholder="Search channel"
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
            <button key={ch.name} onClick={() => setCurrent(ch)}>
              {ch.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="player-wrapper">
          {!current && <div className="placeholder">Select a channel</div>}

          {current && current.sources.some(s => s.protocol === "https") && (
            <video ref={videoRef} controls autoPlay muted className="player" />
          )}

          {current && !current.sources.some(s => s.protocol === "https") && (
            <div className="placeholder">
              VLC-only stream<br />
              <button
                onClick={() =>
                  navigator.clipboard.writeText(current.sources[0].url)
                }
              >
                Copy Stream URL
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}