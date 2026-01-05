import "./App.css";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import channels from "../data/channels.json";

function App() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [status, setStatus] = useState(
    "Waiting for channel selection"
  );
  const [activeChannel, setActiveChannel] = useState(null);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  function playChannel(channel) {
    setActiveChannel(channel);

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    video.pause();
    video.removeAttribute("src");
    video.load();

    // HTTP streams → VLC only
    if (channel.protocol === "http") {
      setStatus(
        "This channel is HTTP-only. Copy the URL and play it in VLC."
      );
      return;
    }

    setStatus(`Loading ${channel.name}...`);

    // Native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      video.play();
      setStatus(`Playing ${channel.name}`);
      return;
    }

    // HLS.js
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

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Channels</h2>

        <input
          className="search"
          placeholder="Search channels..."
          disabled
        />

        <div className="channel-list">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="channel"
              onClick={() => playChannel(ch)}
            >
              {ch.name}
            </div>
          ))}
        </div>

        <div className="ad-box">Ad Slot 1</div>
        <div className="ad-box">Ad Slot 2</div>
      </aside>

      {/* PLAYER */}
      <main className="player-area">
        <div className="player-inner">
          <h1>Click-India-Watch</h1>

          <div className="player-wrapper">
            <video ref={videoRef} controls />
          </div>

          <div className="status">{status}</div>

          {activeChannel && activeChannel.protocol === "http" && (
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
