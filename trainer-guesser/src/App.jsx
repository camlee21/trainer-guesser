import { useState } from 'react'
import { useEffect } from 'react'
import { useDailyTrainer } from './hooks/useDailyTrainer'
import { usePersistedGameState } from './hooks/usePersistedGameState'
import TeamGrid from './components/TeamGrid'
import GuessInput from './components/GuessInput'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/react"

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

  const trainerFilter = hintsRevealed >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hintsRevealed >= 3

  return (
    <div className="app-root">
      {/* Background */}
      <div className="bg-overlay" />

      <div className="content-wrapper">
        {/* Header container with flex layout to keep title left and button right */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div>
            <h1 className="title" style={{ margin: 0 }}>Who's that Trainer?</h1>
            <p className="subtitle" style={{ margin: '5px 0 0 0' }}>Guess the trainer from their team</p>
          </div>
          
          {/* React Native-Style Native Ko-fi Link Button */}
          <a 
            href="https://ko-fi.com/I8P7210YG4" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#72a4f2',
              color: '#ffffff',
              textDecoration: 'none',
              fontFamily: '"Quicksand", "Nunito", "Segoe UI", sans-serif',
              fontWeight: '700',
              padding: '10px 16px',
              borderRadius: '100px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              fontSize: '15px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0px 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Embedded Ko-fi Mug Icon */}
            <img 
              src="https://storage.ko-fi.com/cdn/cup-border.png" 
              alt="Ko-fi cup" 
              style={{ height: '18px', width: 'auto', display: 'initial' }}
            />
            <span>Support me on Ko-fi</span>
          </a>
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
              <div className={`difficulty-badge ${trainer.difficulty}`}>
                Difficulty: {trainer.difficulty.charAt(0).toUpperCase() + trainer.difficulty.slice(1)}
              </div>
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
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

export default App