import { useState } from 'react'
import { useDailyTrainer } from './hooks/useDailyTrainer'
import { usePersistedGameState } from './hooks/usePersistedGameState'
import TeamGrid from './components/TeamGrid'
import GuessInput from './components/GuessInput'

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

function App() {
  const trainer = useDailyTrainer()
  const { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed } = usePersistedGameState()

  const MAX_GUESSES = 5

  function handleGuess(selected) {
    const isCorrect = selected.id === trainer.id
    const newGuesses = [...guesses, { ...selected, correct: isCorrect }]
    setGuesses(newGuesses)

    if (isCorrect) {
      setGameOver('won')
      setHintsRevealed(5)
      return
    }

    const newHints = newGuesses.length
    setHintsRevealed(newHints)

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver('lost')
    }
  }

  function handlePass() {
    const newGuesses = [...guesses, { id: '__pass__', label: 'Passed', correct: false }]
    setGuesses(newGuesses)
    const newHints = newGuesses.length
    setHintsRevealed(newHints)
    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver('lost')
    }
  }

  // Trainer image: placeholder until hint 3 (silhouette), fully revealed at hint 4
  const trainerFilter =
    hintsRevealed >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hintsRevealed >= 3

  return (
    <div className="app-root">
      {/* Background */}
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header>
          <h1 className="title">Who's that Trainer?</h1>
          <p className="subtitle">Guess the trainer from their team</p>
        </header>

        <main className="main-layout">
          {/* LEFT: Trainer panel */}
          <div className="trainer-panel">
            <div className="trainer-frame">
              {showTrainer ? (
                <img
                  draggable="false"
                  src={trainer.trainerSpriteUrl}
                  alt="trainer"
                  className="trainer-sprite"
                  style={{ filter: trainerFilter }}
                />
              ) : (
                <div className="trainer-placeholder">
                  <span>?</span>
                </div>
              )}
            </div>

            <div className="trainer-info">
              {hintsRevealed >= 2 && (
                <div className="info-pill">Game: {trainer.game}</div>
              )}
              {hintsRevealed >= 3 && (
                <div className="info-pill">Type: {toTitleCase(trainer.type)}</div>
              )}
            </div>
          </div>

          {/* RIGHT: Team + Guess */}
          <div className="right-panel">
            <TeamGrid team={trainer.team} revealed={hintsRevealed >= 1} />

            {/* Guess area */}
            {!gameOver ? (
              <div className="guess-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="pass-btn" onClick={handlePass}>
                    Pass
                  </button>
                  <GuessInput onGuess={handleGuess} disabled={!!gameOver} />
                </div>
                <div className="guess-counter">
                  {MAX_GUESSES - guesses.length} guess{MAX_GUESSES - guesses.length !== 1 ? 'es' : ''} remaining
                </div>
              </div>
            ) : (
              <div className={`result-banner ${gameOver}`}>
                {gameOver === 'won'
                  ? `You got it! It was ${trainer.name}!`
                  : `Game Over! It was ${trainer.name}!`}
              </div>
            )}

            {/* Previous guesses */}
            {guesses.length > 0 && (
              <div className="guess-history">
                {guesses.map((g, i) => (
                  <div key={i} className={`guess-chip ${g.correct ? 'correct' : 'wrong'}`}>
                    <span>{g.correct ? '✓' : '✗'}</span>
                    {g.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App