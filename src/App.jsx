import "./App.css";

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Channels</h2>

        {/* Search placeholder */}
        <input
          className="search"
          placeholder="Search channels..."
          disabled
        />

        {/* Channel list placeholder */}
        <div className="channel-list">
          <div className="channel">Loading…</div>
        </div>

        {/* Adsterra placeholders */}
        <div className="ad-box">Ad Slot 1</div>
        <div className="ad-box">Ad Slot 2</div>
      </aside>

<main className="player-area">
  <div className="player-inner">
    <h1>Click-India-Watch</h1>

    <div className="player-wrapper">
      <video controls />
    </div>

    <div className="status">
      Status: Waiting for channel selection
    </div>
  </div>
</main>

    </div>
  );
}

export default App;
