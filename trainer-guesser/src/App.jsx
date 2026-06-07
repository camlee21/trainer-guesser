import { useState } from 'react'
import { useDailyTrainer } from './hooks/useDailyTrainer'
import TeamGrid from './components/TeamGrid'
import GuessInput from './components/GuessInput'

function App() {
  const trainer = useDailyTrainer()
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [guesses, setGuesses] = useState([])
  const [gameOver, setGameOver] = useState(false)

  const MAX_GUESSES = 5

  function handleGuess(selected) {
    const isCorrect = selected.id === trainer.id
    const newGuesses = [...guesses, { ...selected, correct: isCorrect }]
    setGuesses(newGuesses)

    if (isCorrect) {
      setGameOver('won')
      return
    }

    const newHints = newGuesses.length
    setHintsRevealed(newHints)

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver('lost')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Who's that Trainer?</h1>

      {/* Trainer sprite */}
      {hintsRevealed >= 3 && (
        <div className="mb-8 w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
          <img
            src={trainer.trainerSpriteUrl}
            alt="trainer"
            className="w-full h-full object-contain"
            style={{ filter: hintsRevealed >= 4 ? 'none' : 'brightness(0)' }}
          />
        </div>
      )}

      {/* Progressive hints */}
      {hintsRevealed >= 2 && <p className="mb-2 text-yellow-400">Game: {trainer.game}</p>}
      {hintsRevealed >= 3 && <p className="mb-4 text-yellow-400">Type: {trainer.type.replace('_', ' ')}</p>}

      {/* Game over message */}
      {gameOver === 'won' && <p className="mb-4 text-green-400 font-bold">You got it! It was {trainer.name}!</p>}
      {gameOver === 'lost' && <p className="mb-4 text-red-400 font-bold">It was {trainer.name}!</p>}

      {/* Guess UI */}
      <GuessInput onGuess={handleGuess} disabled={!!gameOver} />

      {/* Previous guesses */}
      {guesses.length > 0 && (
        <div className="mb-4 flex flex-col gap-1 w-full max-w-md">
          {guesses.map((g, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded-lg text-sm ${g.correct ? 'bg-green-700' : 'bg-red-800'}`}
            >
              {g.label} {g.correct ? '✓' : '✗'}
            </div>
          ))}
        </div>
      )}

      {/* Pokemon team grid */}
      <TeamGrid team={trainer.team} revealed={hintsRevealed >= 1} />
    </div>
  )
}

export default App