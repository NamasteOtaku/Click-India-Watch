import React from 'react'

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedLanguage,
  setSelectedLanguage,
  languages,
  selectedStatus,
  setSelectedStatus,
  hideRestricted,
  setHideRestricted,
}) {
  return (
    <div className="control-bar">
      <div className="filter-row">
        <div className="filter-group search-group">
          <input
            type="search"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category-select">Category</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="language-select">Language</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="filter-select"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-select">Status</label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Stable">Stable</option>
            <option value="Unstable">Unstable</option>
            <option value="Dead">Dead</option>
          </select>
        </div>

        <div className="filter-group browser-toggle-group">
          <label htmlFor="hide-restricted">
            <input
              id="hide-restricted"
              type="checkbox"
              checked={hideRestricted}
              onChange={(e) => setHideRestricted(e.target.checked)}
              className="browser-toggle-input"
            />
            Hide app-only streams
          </label>
        </div>
      </div>
    </div>
  )
}