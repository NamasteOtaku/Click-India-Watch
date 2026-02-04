import React from 'react'

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedLanguage,
  onLanguageChange,
  languages,
  selectedStatus,
  onStatusChange,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-row">
        <div className="filter-group search-group">
          <input
            type="search"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-input search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category-select">Category</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
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
            onChange={(e) => onLanguageChange(e.target.value)}
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
            onChange={(e) => onStatusChange(e.target.value)}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Stable">Stable</option>
            <option value="Unstable">Unstable</option>
            <option value="Dead">Dead</option>
          </select>
        </div>
      </div>
    </div>
  )
}
