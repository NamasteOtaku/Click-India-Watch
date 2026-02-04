import React from 'react'

export default function ChannelCard({ name, online }){
  return (
    <article className={`channel-card ${online ? 'online' : 'offline'}`}>
      <div className="meta">
        <h2>{name}</h2>
        <span className="status">{online ? 'LIVE' : 'Offline'}</span>
      </div>
    </article>
  )
}
