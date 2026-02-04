// site/src/components/ChannelCard.jsx
import React from 'react'

export default function ChannelCard({
  channel,
  isFavorite,
  onFavorite,
  onPlay,
}) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'live':
        return 'status-live'
      case 'slow':
        return 'status-slow'
      case 'dead':
        return 'status-dead'
      case 'unstable':
        return 'status-unstable'
      default:
        return 'status-unknown'
    }
  }

  const getStatusLabel = (status) => {
    if (status === 'unknown') return '?'
    return status.toUpperCase().substring(0, 1)
  }

  return (
    <div className="channel-card">
      <div className="card-header">
        {channel.logo ? (
          <img src={channel.logo} alt={channel.name} className="logo" />
        ) : (
          <div className="logo-placeholder">📺</div>
        )}
        <button
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={onFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '❤' : '🤍'}
        </button>
      </div>

      <div className="card-body">
        <h3 className="channel-name">{channel.name}</h3>
        {channel.group && <p className="channel-group">{channel.group}</p>}
        {channel.resp_time_ms && (
          <p className="channel-meta">{Math.round(channel.resp_time_ms)}ms</p>
        )}
      </div>

      <div className="card-footer">
        <span className={`status-badge ${getStatusClass(channel.status)}`}>
          {getStatusLabel(channel.status)}
        </span>
        <button className="play-btn" onClick={onPlay} title="Play">
          ▶
        </button>
      </div>
    </div>
  )
}