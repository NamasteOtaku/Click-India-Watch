import React, { useState, useEffect } from 'react'
import ChannelCard from './components/ChannelCard.jsx'
import FilterBar from './components/FilterBar.jsx'
import Player from './components/Player.jsx'

const GITHUB_USER = 'NamasteOtaku'
const GITHUB_REPO = 'Click-India-Watch'
const ADS_ENABLED = true

export default function App() {
  const [channels, setChannels] = useState([])
  const [filteredChannels, setFilteredChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [favorites, setFavorites] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [hideRestrictedStreams, setHideRestrictedStreams] = useState(true)
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('favorites')
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)))
    }
    const hideRestricted = localStorage.getItem('hideRestrictedStreams')
    if (hideRestricted !== null) {
      setHideRestrictedStreams(JSON.parse(hideRestricted))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify([...favorites]))
  }, [favorites])

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    filterChannels()
  }, [channels, searchQuery, selectedCategory, selectedLanguage, selectedStatus, showFavOnly, hideRestrictedStreams, favorites])

  useEffect(() => {
    if (ADS_ENABLED) {
      // Adsterra script will be injected here later
    }
  }, [])

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const chRes = await fetch(
        `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/channels.json`
      )
      if (!chRes.ok) throw new Error('Failed to fetch channels')
      const chData = await chRes.json()

      let statusData = {}
      try {
        const statusRes = await fetch(
          `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/status/latest.json`
        )
        if (statusRes.ok) {
          const statuses = await statusRes.json()
          statusData = Object.fromEntries(statuses.map(s => [s.id, s]))
        }
      } catch (err) {
        console.warn('Could not fetch status:', err.message)
      }

      const merged = chData.map(ch => ({
        ...ch,
        status: statusData[ch.id]?.status || 'unknown',
        http_code: statusData[ch.id]?.http_code || null,
        resp_time_ms: statusData[ch.id]?.resp_time_ms || null,
      }))

      setChannels(merged)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getChannelStatus = (channel) => {
    const score = channel.health_score || 1.0
    if (score >= 0.7) return 'Stable'
    if (score >= 0.3) return 'Unstable'
    return 'Dead'
  }

  const getCategories = () => {
    const cats = new Set(channels.map(ch => ch.group).filter(Boolean))
    return ['All', ...Array.from(cats).sort()]
  }

  const getLanguages = () => {
    const langs = new Set(channels.map(ch => ch.language).filter(Boolean))
    return ['All', ...Array.from(langs).sort()]
  }

  const filterChannels = () => {
    let result = channels

    if (searchQuery) {
      const term = searchQuery.toLowerCase()
      result = result.filter(
        ch =>
          ch.name.toLowerCase().includes(term) ||
          (ch.group && ch.group.toLowerCase().includes(term))
      )
    }

    if (selectedCategory !== 'All') {
      result = result.filter(ch => ch.group === selectedCategory)
    }

    if (selectedLanguage !== 'All') {
      result = result.filter(ch => ch.language === selectedLanguage)
    }

    if (selectedStatus !== 'All') {
      result = result.filter(ch => getChannelStatus(ch) === selectedStatus)
    }

    if (hideRestrictedStreams) {
      result = result.filter(ch => ch.browser_playable !== false)
    }

    if (showFavOnly) {
      result = result.filter(ch => favorites.has(ch.id))
    }

    setFilteredChannels(result)
  }

  const toggleFavorite = (id) => {
    const newFavs = new Set(favorites)
    if (newFavs.has(id)) {
      newFavs.delete(id)
    } else {
      newFavs.add(id)
    }
    setFavorites(newFavs)
  }

  const handlePlay = (channel) => {
    setSelectedChannel(channel)
  }

  const handleClose = () => {
    setSelectedChannel(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Click India Watch</h1>
          <div className="header-meta">
            <span className="fav-counter">❤ {favorites.size}</span>
            <button
              className="fav-toggle"
              onClick={() => setShowFavOnly(!showFavOnly)}
              title="Show favorites only"
            >
              {showFavOnly ? '★' : '☆'} Favorites
            </button>
          </div>
        </div>
      </header>

      {ADS_ENABLED && <div id="ad-top-banner" className="ad-slot"></div>}

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={getCategories()}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        languages={getLanguages()}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        hideRestrictedStreams={hideRestrictedStreams}
        onHideRestrictedChange={(val) => {
          setHideRestrictedStreams(val)
          localStorage.setItem('hideRestrictedStreams', JSON.stringify(val))
        }}
      />

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading channels...</div>
      ) : (
        <>
          <div className="stats">
            Showing {filteredChannels.length} of {channels.length} channels
          </div>

          <div className="grid">
            {filteredChannels.map(ch => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                isFavorite={favorites.has(ch.id)}
                onFavorite={() => toggleFavorite(ch.id)}
                onPlay={() => handlePlay(ch)}
              />
            ))}
          </div>

          {filteredChannels.length === 0 && (
            <div className="no-results">No channels found</div>
          )}
        </>
      )}

      {ADS_ENABLED && <div id="ad-inline-player" className="ad-slot"></div>}

      {selectedChannel && (
        <Player channel={selectedChannel} onClose={handleClose} />
      )}

      {ADS_ENABLED && (
        <div id="ad-mobile-sticky" className="ad-slot ad-sticky"></div>
      )}
    </div>
  )
}