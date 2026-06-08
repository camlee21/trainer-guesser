import { useState, useRef, useEffect } from 'react'
import { useInfiniteMode } from '../hooks/useInfiniteMode'
import TeamGrid from './TeamGrid'
import GuessInput from './GuessInput'

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

function CompletedRound({ round }) {
  const { trainer, guesses, gameOver, hints } = round
  const trainerFilter = hints >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hints >= 3

  return (
    <div className="inf-round inf-round--completed">
      <div className="inf-round-inner">
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
              <div className="trainer-placeholder"><span>?</span></div>
            )}
          </div>
          <div className="trainer-info">
            <div className={`difficulty-badge ${trainer.difficulty}`}>
              {trainer.difficulty.charAt(0).toUpperCase() + trainer.difficulty.slice(1)}
            </div>
            {hints >= 2 && <div className="info-pill">{trainer.game}</div>}
            {hints >= 3 && <div className="info-pill">{toTitleCase(trainer.type)}</div>}
          </div>
        </div>

        <div className="right-panel">
          <TeamGrid team={trainer.team} revealed={hints >= 1} />
          <div className={`result-banner ${gameOver} inf-result-banner`}>
            {gameOver === 'won'
              ? `✓ ${trainer.name}`
              : `✗ ${trainer.name}`}
          </div>
          <div className="guess-history">
            {guesses.map((g, i) => (
              <div key={i} className={`guess-chip ${g.correct ? 'correct' : 'wrong'}`}>
                <span>{g.correct ? '✓' : '✗'}</span>
                {g.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GameFilter({ allGames, selectedGames, toggleGame, selectAllGames, activePool }) {
  const allSelected = selectedGames.size === allGames.length

  return (
    <div className="game-filter">
      <div className="game-filter-header">
        <span className="game-filter-label">Games</span>
        <button
          className="game-filter-all"
          onClick={selectAllGames}
          disabled={allSelected}
        >
          All
        </button>
      </div>
      <div className="game-filter-chips">
        {allGames.map(game => (
          <button
            key={game}
            className={`game-chip ${selectedGames.has(game) ? 'active' : ''}`}
            onClick={() => toggleGame(game)}
          >
            {game}
          </button>
        ))}
      </div>
      <div className="game-filter-count">
        {activePool.length} trainer{activePool.length !== 1 ? 's' : ''} in pool
      </div>
    </div>
  )
}

export default function InfiniteMode() {
  const {
    allGames, selectedGames, toggleGame, selectAllGames, activePool,
    rounds,
    currentTrainer, currentGuesses, currentHints, currentGameOver, isTransitioning,
    handleGuess, handlePass, advanceRound, resetGame,
    MAX_GUESSES,
  } = useInfiniteMode()

  const [isPlaying, setIsPlaying] = useState(false)
  const scrollRef = useRef(null)
  const currentRef = useRef(null)

  // Scroll to current round smoothly when a new round starts
  useEffect(() => {
    if (isPlaying && !isTransitioning && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [rounds.length, isTransitioning, isPlaying])

  const handleStartGame = () => {
    if (activePool.length === 0) return
    resetGame() // Forces Round 1 trainer selection to adhere to the checked active filters snapshot
    setIsPlaying(true)
  }

  const trainerFilter = currentHints >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = currentHints >= 3

  // If the user hasn't clicked "Start Game", just show the Filters overlay configuration view
  if (!isPlaying) {
    return (
      <div className="inf-root">
        <GameFilter
          allGames={allGames}
          selectedGames={selectedGames}
          toggleGame={toggleGame}
          selectAllGames={selectAllGames}
          activePool={activePool}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button
            onClick={handleStartGame}
            disabled={activePool.length === 0}
            style={{
              backgroundColor: activePool.length === 0 ? 'rgba(255, 255, 255, 0.05)' : '#72a4f2',
              color: activePool.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: activePool.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: activePool.length === 0 ? 'none' : '0 4px 14px rgba(114, 164, 242, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="inf-root">
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setIsPlaying(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          ← Change Filters
        </button>
      </div>

      <div className="inf-scroll" ref={scrollRef}>
        {/* Completed rounds */}
        {rounds.map((round, i) => (
          <CompletedRound key={i} round={round} />
        ))}

        {/* Current round */}
        <div
          ref={currentRef}
          className={`inf-round inf-round--current ${isTransitioning ? 'inf-round--exiting' : 'inf-round--entering'}`}
        >
          <div className="inf-round-divider">
            <span>Round {rounds.length + 1}</span>
          </div>
          <div className="inf-round-inner">
            <div className="trainer-panel">
              <div className="trainer-frame">
                {showTrainer ? (
                  <img
                    draggable="false"
                    src={currentTrainer.trainerSpriteUrl}
                    alt="trainer"
                    className="trainer-sprite"
                    style={{ filter: trainerFilter }}
                  />
                ) : (
                  <div className="trainer-placeholder"><span>?</span></div>
                )}
              </div>
              <div className="trainer-info">
                <div className={`difficulty-badge ${currentTrainer.difficulty}`}>
                  Difficulty: {currentTrainer.difficulty.charAt(0).toUpperCase() + currentTrainer.difficulty.slice(1)}
                </div>
                {currentHints >= 2 && <div className="info-pill">Game: {currentTrainer.game}</div>}
                {currentHints >= 3 && <div className="info-pill">Type: {toTitleCase(currentTrainer.type)}</div>}
              </div>
            </div>

            <div className="right-panel">
              <TeamGrid team={currentTrainer.team} revealed={currentHints >= 1} />

              {!currentGameOver ? (
                <div className="guess-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="pass-btn" onClick={handlePass}>Pass</button>
                    <GuessInput onGuess={handleGuess} disabled={!!currentGameOver} />
                  </div>
                  <div className="guess-counter">
                    {MAX_GUESSES - currentGuesses.length} guess{MAX_GUESSES - currentGuesses.length !== 1 ? 'es' : ''} remaining
                  </div>
                </div>
              ) : (
                <div className="inf-gameover-row">
                  <div className={`result-banner ${currentGameOver}`}>
                    {currentGameOver === 'won'
                      ? `You got it! It was ${currentTrainer.name}!`
                      : `Game Over! It was ${currentTrainer.name}!`}
                  </div>
                  <button className="next-btn" onClick={advanceRound}>
                    Next →
                  </button>
                </div>
              )}

              {currentGuesses.length > 0 && (
                <div className="guess-history">
                  {currentGuesses.map((g, i) => (
                    <div key={i} className={`guess-chip ${g.correct ? 'correct' : 'wrong'}`}>
                      <span>{g.correct ? '✓' : '✗'}</span>
                      {g.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom padding so current round isn't flush at bottom */}
        <div style={{ height: '60px' }} />
      </div>
    </div>
  )
}