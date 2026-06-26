import { useState, useRef, useEffect } from 'react'
import TeamGrid from '../components/TeamGrid'
import GuessInput from '../components/GuessInput'
import { useDailyTrainer } from '../hooks/useDailyTrainer'
import { usePersistedGameState } from '../hooks/usePersistedGameState'
import { useInfiniteMode } from '../hooks/useInfiniteMode'

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function DayBadge({ dayNumber, isProvided, providedBy, providedLink }) {
  return (
    <div className="day-badge">
      <span className="day-badge-number">Day #{dayNumber}</span>
      {isProvided && providedBy && (
        <span className="day-badge-provided">
          provided by{' '}
          {providedLink ? (
            <a href={providedLink} target="_blank" rel="noopener noreferrer">
              {providedBy}
            </a>
          ) : (
            providedBy
          )}
        </span>
      )}
    </div>
  )
}

function DailyMode() {
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
    <main className="main-layout">
      <div className="trainer-panel">
        <div className="trainer-frame-wrapper">
          <DayBadge
            dayNumber={trainer.dayNumber}
            isProvided={trainer.isProvided}
            providedBy={trainer.providedBy}
            providedLink={trainer.providedLink}
          />
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

      <div className="right-panel">
        <TeamGrid team={trainer.team} revealed={hintsRevealed >= 1} />

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
  )
}

function CompletedRound({ round, scoreForRound, MAX_GUESSES }) {
  const { trainer, guesses, gameOver, hints, elapsedSeconds } = round
  const trainerFilter = hints >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hints >= 3
  const points = scoreForRound(guesses, gameOver)

  return (
    <div className="inf-round inf-round--completed" style={{ marginBottom: '40px' }}>
      <div className="inf-round-inner main-layout">
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
          <div className="inf-result-banner-row">
            <div className={`result-banner ${gameOver} inf-result-banner`} style={{ flex: 1 }}>
              {gameOver === 'won' ? `✓ ${trainer.name}` : `✗ ${trainer.name}`}
            </div>
            <div className="round-score-tag">{points}/{MAX_GUESSES}</div>
            {typeof elapsedSeconds === 'number' && (
              <div className="round-score-tag">{formatTime(elapsedSeconds)}</div>
            )}
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

const GEN_MAP = {
  'Gen 1': ['Red/Blue'],
  'Gen 2': ['Gold/Silver'],
  'Gen 3': ['Ruby/Sapphire', 'Emerald', 'Colosseum', 'XD: Gale of Darkness'],
  'Gen 4': ['HeartGold/SoulSilver', 'Platinum'],
  'Gen 5': ['Black/White', 'Black2/White2'],
  'Gen 6': ['X/Y', 'Omega Ruby/Alpha Sapphire'],
  'Gen 7': ['Sun/Moon', 'Ultra Sun/Ultra Moon'],
  'Gen 8': ['Sword/Shield', 'Legends Arceus'],
  'Gen 9': ['Scarlet/Violet', 'Legends Z-A'],
}

const DIFFICULTIES = ['easy', 'medium', 'hard']

const DIFFICULTY_STYLES = {
  easy: {
    active: 'rgba(74,222,128,0.18)',
    activeBorder: 'rgba(74,222,128,0.45)',
    activeColor: '#4ade80',
    activeGlow: 'rgba(74,222,128,0.25)',
  },
  medium: {
    active: 'rgba(251,191,36,0.18)',
    activeBorder: 'rgba(251,191,36,0.45)',
    activeColor: '#fbbf24',
    activeGlow: 'rgba(251,191,36,0.25)',
  },
  hard: {
    active: 'rgba(248,113,113,0.18)',
    activeBorder: 'rgba(248,113,113,0.45)',
    activeColor: '#f87171',
    activeGlow: 'rgba(248,113,113,0.25)',
  },
}

function GameFilter({
  allGames, selectedGames, toggleGame, setSelectedGames, selectAllGames, activePool,
  selectedDifficulties, toggleDifficulty, selectAllDifficulties,
  enabledExtras, toggleExtra, EXTRAS_META,
}) {
  const [activeGens, setActiveGens] = useState(new Set())

  const displayMap = {
    'Ruby': 'Ruby/Sapphire',
    'Sapphire': 'Ruby/Sapphire',
    'Black': 'Black/White',
    'White': 'Black/White',
    'Black2': 'Black2/White2',
    'White2': 'Black2/White2',
    'Scarlet': 'Scarlet/Violet',
    'Violet': 'Scarlet/Violet',
  }

  const visibleButtons = []
  const seenGrouped = new Set()
  allGames.forEach(game => {
    const displayLabel = displayMap[game] || game
    if (!seenGrouped.has(displayLabel)) {
      seenGrouped.add(displayLabel)
      visibleButtons.push({
        label: displayLabel,
        originals: allGames.filter(g => (displayMap[g] || g) === displayLabel)
      })
    }
  })

  const allSelected = selectedGames.size === allGames.length
  const allDifficultiesSelected = selectedDifficulties.size === DIFFICULTIES.length

  const firstButtonGroup = visibleButtons[0]?.originals || []
  const isDeselectedState = selectedGames.size === 0

  const handleGroupToggle = (group) => {
    const isCurrentlyActive = group.originals.every(g => selectedGames.has(g))
    if (isCurrentlyActive) {
      if (selectedGames.size - group.originals.length <= 0 && enabledExtras.size === 0) return
    }
    group.originals.forEach(g => {
      const active = selectedGames.has(g)
      if (isCurrentlyActive && active) toggleGame(g)
      else if (!isCurrentlyActive && !active) toggleGame(g)
    })
  }

  const handleDeselectAll = () => {
    setSelectedGames(new Set())
    setActiveGens(new Set())
  }

  const handleSelectAll = () => {
    selectAllGames()
    setActiveGens(new Set())
  }

  const rawToDisplay = { Ruby: 'Ruby/Sapphire', Sapphire: 'Ruby/Sapphire', Black: 'Black/White', White: 'Black/White', Black2: 'Black2/White2', White2: 'Black2/White2', Scarlet: 'Scarlet/Violet', Violet: 'Scarlet/Violet' }

  const handleGenToggle = (gen) => {
    const isOn = activeGens.has(gen)
    const newActiveGens = new Set(activeGens)

    if (isOn) {
      newActiveGens.delete(gen)
      if (newActiveGens.size === 0) {
        setActiveGens(newActiveGens)
        return
      }
    } else {
      newActiveGens.add(gen)
    }

    const targetLabels = new Set()
    newActiveGens.forEach(g => { (GEN_MAP[g] || []).forEach(l => targetLabels.add(l)) })

    const newSet = new Set(allGames.filter(game => targetLabels.has(rawToDisplay[game] || game)))
    if (newSet.size === 0 && enabledExtras.size === 0) return
    setSelectedGames(newSet)
    setActiveGens(newActiveGens)
  }

  const availableGens = Object.keys(GEN_MAP).filter(gen =>
    (GEN_MAP[gen] || []).some(label =>
      allGames.some(g => (rawToDisplay[g] || g) === label)
    )
  )

  const extrasKeys = Object.keys(EXTRAS_META)

  return (
    <div className="game-filter-panel">

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">Difficulty</span>
          <button
            onClick={selectAllDifficulties}
            disabled={allDifficultiesSelected}
            className={`filter-ctrl-btn ${allDifficultiesSelected ? 'disabled' : 'accent'}`}
          >
            Select All
          </button>
        </div>
        <div className="difficulty-filter-row">
          {DIFFICULTIES.map(diff => {
            const isActive = selectedDifficulties.has(diff)
            const styles = DIFFICULTY_STYLES[diff]
            const cantDeselect = isActive && selectedDifficulties.size <= 1
            return (
              <button
                key={diff}
                onClick={() => !cantDeselect && toggleDifficulty(diff)}
                className={`difficulty-filter-btn ${isActive ? 'active' : ''} ${cantDeselect ? 'cant-deselect' : ''}`}
                style={isActive ? {
                  background: styles.active,
                  borderColor: styles.activeBorder,
                  color: styles.activeColor,
                  boxShadow: `0 0 10px ${styles.activeGlow}`,
                } : {}}
                title={cantDeselect ? 'At least one difficulty must be selected' : ''}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-divider" />

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">Generation</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              className={`filter-ctrl-btn ${allSelected ? 'disabled' : 'accent'}`}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={isDeselectedState || allGames.length === 0}
              className={`filter-ctrl-btn ${isDeselectedState || allGames.length === 0 ? 'disabled' : ''}`}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {availableGens.map(gen => {
            const isOn = activeGens.has(gen)
            return (
              <button
                key={gen}
                onClick={() => handleGenToggle(gen)}
                className={`gen-filter-btn ${isOn ? 'active' : ''}`}
              >
                {gen}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {visibleButtons.map(group => {
            const isActive = group.originals.every(g => selectedGames.has(g))
            const isDisableCandidate = isActive && (selectedGames.size - group.originals.length <= 0) && enabledExtras.size === 0
            return (
              <button
                key={group.label}
                onClick={() => {
                  handleGroupToggle(group)
                  setActiveGens(new Set())
                }}
                className={`game-filter-btn ${isActive ? 'active' : ''} ${isDisableCandidate ? 'cant-deselect' : ''}`}
              >
                <span>{isActive ? '✓' : '+'}</span>
                {group.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-divider" />

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">Extras</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {extrasKeys.map(key => {
            const meta = EXTRAS_META[key]
            const isActive = enabledExtras.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleExtra(key)}
                className={`extras-filter-btn ${isActive ? 'active' : ''}`}
              >
                <span>{isActive ? '✓' : '+'}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-divider" />
      <div className="filter-pool-count">
        {activePool.length} trainer{activePool.length !== 1 ? 's' : ''} available with current selections
      </div>
    </div>
  )
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-top-btn ${visible ? 'visible' : ''}`}
      title="Back to top"
      aria-label="Scroll to top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}

function ScrollToBottomButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      const scrolledFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      setVisible(scrolledFromBottom > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToBottom}
      className={`scroll-bottom-btn ${visible ? 'visible' : ''}`}
      title="Scroll to bottom"
      aria-label="Scroll to bottom"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  )
}

function InfiniteMode({ onResetSession }) {
  const {
    allGames, selectedGames, toggleGame, setSelectedGames, selectAllGames, activePool,
    selectedDifficulties, toggleDifficulty, selectAllDifficulties,
    enabledExtras, toggleExtra, EXTRAS_META,
    rounds,
    currentTrainer, currentGuesses, currentHints, currentGameOver, isTransitioning,
    handleGuess, handlePass, advanceRound, resetGame,
    MAX_GUESSES,
    totalScore, totalPossible, scoreForRound,
    totalElapsedSeconds, roundElapsedSeconds, finalRoundElapsedSeconds, startTimer, stopTimer,
  } = useInfiniteMode()

  const [isPlaying, setIsPlaying] = useState(false)
  const scrollRef = useRef(null)
  const currentRef = useRef(null)

  useEffect(() => {
    if (isPlaying && !isTransitioning && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [rounds.length, isTransitioning, isPlaying])

  useEffect(() => {
    if (isPlaying) {
      startTimer()
    } else {
      stopTimer()
    }
  }, [isPlaying, startTimer, stopTimer])

  const handleStartGame = () => {
    if (activePool.length === 0) return
    if (typeof resetGame === 'function') resetGame()
    setIsPlaying(true)
  }

  const handleBackToFilters = () => {
    setIsPlaying(false)
    if (typeof onResetSession === 'function') onResetSession()
  }

  const trainerFilter = currentHints >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = currentHints >= 3

  if (!isPlaying) {
    return (
      <div className="inf-root">
        <GameFilter
          allGames={allGames}
          selectedGames={selectedGames}
          toggleGame={toggleGame}
          setSelectedGames={setSelectedGames}
          selectAllGames={selectAllGames}
          activePool={activePool}
          selectedDifficulties={selectedDifficulties}
          toggleDifficulty={toggleDifficulty}
          selectAllDifficulties={selectAllDifficulties}
          enabledExtras={enabledExtras}
          toggleExtra={toggleExtra}
          EXTRAS_META={EXTRAS_META}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button
            onClick={handleStartGame}
            disabled={activePool.length === 0}
            className={`primary-btn ${activePool.length === 0 ? 'disabled' : ''}`}
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="inf-root" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={handleBackToFilters} className="back-btn">
          ← Back to Game Select
        </button>
      </div>

      <div className="inf-layout-with-score">
        <div className="inf-scroll" ref={scrollRef}>
          {rounds.map((round, i) => (
            <CompletedRound key={i} round={round} scoreForRound={scoreForRound} MAX_GUESSES={MAX_GUESSES} />
          ))}

          <div
            ref={currentRef}
            className={`inf-round inf-round--current ${isTransitioning ? 'inf-round--exiting' : 'inf-round--entering'}`}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '32px 0 20px 0', position: 'relative'
            }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <span className="round-label">
                Round {rounds.length + 1}
              </span>
            </div>

            <div className="inf-round-inner main-layout">
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
                      <GuessInput
                        onGuess={handleGuess}
                        disabled={!!currentGameOver}
                        enabledExtras={enabledExtras}
                        extrasMeta={EXTRAS_META}
                      />
                    </div>
                    <div className="guess-counter">
                      {MAX_GUESSES - currentGuesses.length} guess{MAX_GUESSES - currentGuesses.length !== 1 ? 'es' : ''} remaining
                    </div>
                  </div>
                ) : (
                  <div className="inf-gameover-block">
                    <div className="inf-gameover-row">
                      <div className={`result-banner ${currentGameOver}`} style={{ flex: 1, margin: 0 }}>
                        {currentGameOver === 'won'
                          ? `You got it! It was ${currentTrainer.name}!`
                          : `Game Over! It was ${currentTrainer.name}!`}
                      </div>
                      <div className="round-score-tag">
                        {scoreForRound(currentGuesses, currentGameOver)}/{MAX_GUESSES}
                      </div>
                      <div className="round-score-tag">
                        {formatTime(finalRoundElapsedSeconds ?? roundElapsedSeconds)}
                      </div>
                    </div>
                    <button className="primary-btn next-btn" onClick={advanceRound}>
                      Next Round →
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
          <div style={{ height: '60px' }} />
        </div>

        <div className="inf-score-sidebar">
          <div className="score-badge">
            <span className="score-badge-label">Score</span>
            <span className="score-badge-value">{totalScore}/{totalPossible}</span>
          </div>
          <div className="score-badge">
            <span className="score-badge-label">Time</span>
            <span className="score-badge-value">{formatTime(totalElapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <ScrollToTopButton />
      <ScrollToBottomButton />
    </div>
  )
}

export default function Home() {
  const [mode, setMode] = useState('daily')
  const [infiniteKey, setInfiniteKey] = useState(0)

  const handleResetInfiniteSession = () => {
    setInfiniteKey(prev => prev + 1)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div className="mode-toggle">
          <div
            className="mode-toggle-slider"
            style={{ transform: mode === 'infinite' ? 'translateX(100%)' : 'translateX(0%)' }}
          />
          <button
            onClick={() => setMode('daily')}
            className={`mode-toggle-btn ${mode === 'daily' ? 'active' : ''}`}
          >
            <span>📅</span> Daily
          </button>
          <button
            onClick={() => setMode('infinite')}
            className={`mode-toggle-btn ${mode === 'infinite' ? 'active' : ''}`}
          >
            <span>∞</span> Infinite
          </button>
        </div>
      </div>

      {mode === 'daily' ? (
        <DailyMode />
      ) : (
        <InfiniteMode
          key={infiniteKey}
          onResetSession={handleResetInfiniteSession}
        />
      )}
    </>
  )
}