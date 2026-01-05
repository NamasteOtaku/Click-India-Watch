import "./App.css";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import channels from "./data/channels.json";

function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [status, setStatus] = useState("Waiting for channel selection");
  const [activeChannel, setActiveChannel] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  function playChannel(channel) {
    setActiveChannel(channel);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    video.pause();
    video.removeAttribute("src");
    video.load();

    if (channel.protocol === "http") {
      setStatus("HTTP stream. Copy URL and play in VLC.");
      return;
    }

    setStatus(`Loading ${channel.name}...`);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      video.play();
      setStatus(`Playing ${channel.name}`);
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
        setStatus(`Playing ${channel.name}`);
      });

      hls.on(Hls.Events.ERROR, () => {
        setStatus(`Error playing ${channel.name}`);
      });
    } else {
      setStatus("HLS not supported in this browser");
    }
  }

  function copyUrl() {
    if (!activeChannel) return;
    navigator.clipboard.writeText(activeChannel.url);
    setStatus("Stream URL copied. Open VLC → Media → Open Network Stream.");
  }

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Channels</h2>

        <input
          className="search"
          placeholder="Search channels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="channel-list">
          {filteredChannels.map((ch) => (
            <div
              key={ch.id}
              className={`channel ${
                activeChannel?.id === ch.id ? "active" : ""
              }`}
              onClick={() => playChannel(ch)}
            >
              <span>{ch.name}</span>
              <span
                className={`badge ${
                  ch.protocol === "https" ? "ok" : "warn"
                }`}
              >
                {ch.protocol === "https" ? "LIVE" : "VLC"}
              </span>
            </div>
          ))}
        </div>

        <div className="ad-box">Ad Slot 1</div>
        <div className="ad-box">Ad Slot 2</div>
      </aside>

      <main className="player-area">
        <div className="player-inner">
          <h1>Click-India-Watch</h1>

          <div className="player-wrapper">
            <video ref={videoRef} controls />
          </div>

          <div className="status">{status}</div>

          {activeChannel?.protocol === "http" && (
            <button onClick={copyUrl} style={{ marginTop: "10px" }}>
              Copy Stream URL (VLC)
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
