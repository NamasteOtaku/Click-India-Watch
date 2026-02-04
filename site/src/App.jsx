import React from 'react'
import ChannelCard from './components/ChannelCard.jsx'
import SearchBar from './components/SearchBar.jsx'

export default function App(){
  return (
    <div className="app">
      <header>
        <h1>Click India Watch</h1>
        <SearchBar />
      </header>
      <main>
        <ChannelCard name="Example Channel 1" online={false} />
      </main>
    </div>
  )
}
