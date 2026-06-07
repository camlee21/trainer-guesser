
import { useState } from 'react'
import trainers from '../data/trainers.json'

export default function GuessInput({ onGuess, disabled }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)

  const allTrainers = trainers.trainers.map(t => ({
    id: t.id,
    label: `${t.name} (${t.game})`,
  }))

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    setSelected(null)

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
  }

  function handleGuess() {
    if (!selected) return
    onGuess(selected)
    setQuery('')
    setSelected(null)
    setSuggestions([])
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mb-6">
      {/* Guess button */}
      <button
        onClick={handleGuess}
        disabled={!selected || disabled}
        className="w-full mb-2 py-2 rounded-lg font-bold text-white
          bg-green-600 hover:bg-green-500
          disabled:bg-gray-600 disabled:cursor-not-allowed
          transition-colors"
      >
        Guess
      </button>

      {/* Search input */}
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Choose a trainer..."
          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white
            placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500
            disabled:opacity-50"
        />

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg
            overflow-hidden shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map(t => (
              <li
                key={t.id}
                onClick={() => handleSelect(t)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-600 text-white"
              >
                {t.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}