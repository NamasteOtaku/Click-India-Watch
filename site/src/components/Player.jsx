import React from 'react'

export default function Player({ url }){
  return (
    <div className="player">
      <p>Player placeholder for: <a href={url}>{url}</a></p>
    </div>
  )
}
