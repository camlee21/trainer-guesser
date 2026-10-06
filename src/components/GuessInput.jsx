import { useState, useId } from 'react'
import trainers from '../data/trainers.json'
import ConfirmButton from './ConfirmButton'

export default function GuessInput({ onGuess, onPass, disabled, enabledExtras = new Set(), extrasMeta = {} }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const listId = useId()

  const extraTrainerLists = Object.keys(extrasMeta)
    .filter(key => enabledExtras.has(key))
    .map(key => trainers[extrasMeta[key].dataKey] || [])

  const allTrainers = [...trainers.trainers, ...extraTrainerLists.flat()].map(t => ({
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

    const q = val.toLowerCase()

    const filtered = allTrainers
      .filter(t => t.label.toLowerCase().includes(q))
      .sort((a, b) => {
        const al = a.label.toLowerCase()
        const bl = b.label.toLowerCase()
        const an = a.label.split(' (')[0].toLowerCase()
        const bn = b.label.split(' (')[0].toLowerCase()

        // Exact trainer name match first
        const aExact = an === q
        const bExact = bn === q
        if (aExact && !bExact) return -1
        if (bExact && !aExact) return 1

        // Trainer name starts with query second
        const aStarts = an.startsWith(q)
        const bStarts = bn.startsWith(q)
        if (aStarts && !bStarts) return -1
        if (bStarts && !aStarts) return 1

        // Trainer name contains query (before game name match) third
        const aNameContains = an.includes(q)
        const bNameContains = bn.includes(q)
        if (aNameContains && !bNameContains) return -1
        if (bNameContains && !aNameContains) return 1

        // Fall back to alphabetical
        return al.localeCompare(bl)
      })

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
    // After picking a suggestion the list closes, so Enter submits the guess
    if (e.key === 'Enter' && selected && highlightIndex < 0) {
      handleGuess()
      return
    }
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Enter with nothing highlighted picks the top match, so typing a name and pressing Enter twice works
      handleSelect(suggestions[Math.max(highlightIndex, 0)])
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  const open = suggestions.length > 0

  return (
    <div className="guess-input-wrapper">
      <div className="guess-row">
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
            role="combobox"
            aria-label="Guess a trainer"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && highlightIndex >= 0 ? `${listId}-${highlightIndex}` : undefined}
          />
        </div>
        {/* Spans the whole row rather than just the input, so long names fit on phones */}
        {open && (
          <ul className="suggestions-list" id={listId} role="listbox" aria-label="Matching trainers">
            {suggestions.map((t, i) => (
              <li
                key={t.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlightIndex}
                onMouseDown={() => handleSelect(t)}
                className={`suggestion-item ${i === highlightIndex ? 'highlighted' : ''}`}
              >
                {t.label}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleGuess}
          disabled={!selected || disabled}
          className="guess-btn"
        >
          Guess
        </button>
        {onPass && (
          <ConfirmButton className="pass-btn" confirmLabel="Confirm" onConfirm={onPass}>
            Pass
          </ConfirmButton>
        )}
      </div>
    </div>
  )
}
