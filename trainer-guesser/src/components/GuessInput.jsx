import { useState } from 'react'
import trainers from '../data/trainers.json'

export default function GuessInput({ onGuess, disabled }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const allTrainers = trainers.trainers.map(t => ({
    id: t.id,
    label: `${t.name} (${t.game})`,
  }))

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    setHighlightIndex(-1)

    if (val.trim() === '') {
      setSuggestions([])
      return
    }

    const filtered = allTrainers.filter(t =>
      t.label.toLowerCase().includes(val.toLowerCase())
    )
    setSuggestions(filtered)
  }

  function handleSelect(trainer) {
    setQuery(trainer.label)
    setSelected(trainer)
    setSuggestions([])
    setHighlightIndex(-1)
  }

  function handleGuess() {
    if (!selected) return
    onGuess(selected)
    setQuery('')
    setSelected(null)
    setSuggestions([])
  }

  function handleKeyDown(e) {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      setHighlightIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0) {
        handleSelect(suggestions[highlightIndex])
      } else if (selected) {
        handleGuess()
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  return (
    <div className="guess-input-wrapper">
      <div className="guess-row">
        {/* Search input + dropdown */}
        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Search trainer..."
            className="search-input"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((t, i) => (
                <li
                  key={t.id}
                  onMouseDown={() => handleSelect(t)}
                  className={`suggestion-item ${i === highlightIndex ? 'highlighted' : ''}`}
                >
                  {t.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Guess button */}
        <button
          onClick={handleGuess}
          disabled={!selected || disabled}
          className="guess-btn"
        >
          Guess
        </button>
      </div>
    </div>
  )
}