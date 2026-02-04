// site/src/components/Player.jsx
import React, { useEffect, useRef } from 'react'

export default function Player({ channel, onClose }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.src = channel.stream_url
    video.play().catch(() => {
      console.warn('Autoplay failed or not available')
    })
  }, [channel])

  return (
    <div className="player-overlay" onClick={onClose}>
      <div className="player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="player-header">
          <h2>{channel.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="player-container">
          <video
            ref={videoRef}
            className="player-video"
            controls
            autoPlay
            crossOrigin="anonymous"
          >
            <source src={channel.stream_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="player-info">
          {channel.group && <p>Group: {channel.group}</p>}
          {channel.language && <p>Language: {channel.language}</p>}
          {channel.country && <p>Country: {channel.country}</p>}
          <p className={`status status-${channel.status}`}>
            Status: {channel.status}
          </p>
        </div>
      </div>
    </div>
  )
}