
import { Fragment, useState, useRef, useEffect } from 'react'
import TeamGrid from '../components/TeamGrid'
import GuessInput from '../components/GuessInput'
import ShareButtons from '../components/ShareButtons'
import CountdownTimer from '../components/CountdownTimer'
import GuessAnnouncer from '../components/GuessAnnouncer'
import ConnectionsMode from '../components/ConnectionsMode'
import { ScrollToTopButton, ScrollToBottomButton } from '../components/ScrollButtons'
import { useDailyTrainer } from '../hooks/useDailyTrainer'
import { usePersistedGameState } from '../hooks/usePersistedGameState'
import { useInfiniteMode } from '../hooks/useInfiniteMode'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { computeStreak } from '../lib/streakUtils'
import { recordCompletion } from '../lib/completionCounter'
import { useMedals } from '../contexts/MedalsContext'
import { infiniteSessionProgress, countInfiniteRound } from '../lib/medals'

// WARNING/PSA TEXTS

const is_warning = false // Set to true to display the warning banner. Change to false when the issue is resolved.

const warning_text = "⚠️ Some sprites from PokeAPI are having trouble loading. If there are any missing sprites, please check in again soon!"

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
          requested by{' '}
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

// Never gives the answer away before the game is over
function trainerAlt(hints, gameOver, trainer) {
  if (gameOver) return trainer.name
  return hints >= 4 ? 'The mystery trainer' : "The mystery trainer's silhouette"
}

// The end of today's puzzle: who it was, how many guesses it took, and where to go next
function DailyResult({ gameOver, guesses, trainer, maxGuesses, onPlayConnections }) {
  const won = gameOver === 'won'
  const title = won
    ? (guesses.length === 1 ? 'First try!' : `Got it in ${guesses.length}!`)
    : 'Out of guesses'
  return (
    <div className={`daily-result ${gameOver}`}>
      <p className="daily-result-title">{title}</p>
      <p className="daily-result-name">It was <strong>{trainer.name}</strong> from {trainer.game}.</p>
      <div className="daily-pips" role="img" aria-label={`${guesses.length} of ${maxGuesses} guesses used`}>
        {Array.from({ length: maxGuesses }, (_, i) => {
          const g = guesses[i]
          const state = !g ? 'unused' : g.correct ? 'correct' : 'wrong'
          return <span key={i} className={`daily-pip ${state}`} />
        })}
      </div>
      <div className="daily-result-actions">
        <ShareButtons primary gameOver={gameOver} guesses={guesses} dayNumber={trainer.dayNumber} />
        {onPlayConnections && (
          <button type="button" className="back-btn" onClick={onPlayConnections}>
            Try today's Connections
          </button>
        )}
      </div>
    </div>
  )
}

function DailyMode({ onPlayConnections }) {
  const trainer = useDailyTrainer()
  const { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed, saveResult, saveStatus } = usePersistedGameState(trainer)
  const { user } = useAuthContext()
  const { refresh: refreshMedals } = useMedals()
  const [streak, setStreak] = useState(0)
  // Re-fetch the streak once today's result has actually reached Supabase
  const resultSaved = saveStatus === 'saved'

  // Today's result may have earned medals
  useEffect(() => {
    if (resultSaved) refreshMedals()
  }, [resultSaved, refreshMedals])

  const MAX_GUESSES = 5

  useEffect(() => {
    if (!user) return
    async function fetchStreak() {
      const { data } = await supabase
        .from('daily_results')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(60)
      if (data) setStreak(computeStreak(data))
    }
    fetchStreak()
  }, [user?.id, gameOver, resultSaved])

  async function handleGuess(selected) {
    const isCorrect = selected.id === trainer.id
    const newGuesses = [...guesses, { ...selected, correct: isCorrect }]
    setGuesses(newGuesses)

    if (isCorrect) {
      setGameOver('won')
      setHintsRevealed(5)
      recordCompletion('trainer')
      await saveResult(newGuesses, 'won', 5)
      return
    }

    const newHints = newGuesses.length
    setHintsRevealed(newHints)

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver('lost')
      recordCompletion('trainer')
      await saveResult(newGuesses, 'lost', newHints)
    }
  }

  async function handlePass() {
    const newGuesses = [...guesses, { id: '__pass__', label: 'Passed', correct: false }]
    setGuesses(newGuesses)
    const newHints = newGuesses.length
    setHintsRevealed(newHints)
    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver('lost')
      recordCompletion('trainer')
      await saveResult(newGuesses, 'lost', newHints)
    }
  }

  const trainerFilter = hintsRevealed >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hintsRevealed >= 3

  // When the game ends (not when a finished game is reopened), make sure the result card is on screen;
  // on phones it would otherwise land below the fold
  const resultRef = useRef(null)
  const wasOver = useRef(gameOver)
  useEffect(() => {
    if (gameOver && !wasOver.current) {
      const card = resultRef.current
      const box = card?.getBoundingClientRect()
      if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
      }
    }
    wasOver.current = gameOver
  }, [gameOver])

  return (
    <>
      {is_warning && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <div className="warning-banner">
            {warning_text}
          </div>
        </div>
      )}
      {streak >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="streak-banner">🔥 {streak} day streak!</div>
        </div>
      )}
      <main className="main-layout">
        <div className="trainer-panel">
          <div className="trainer-frame-wrapper">
            <DayBadge
              dayNumber={trainer.dayNumber}
              isProvided={trainer.isProvided}
              providedBy={trainer.providedBy}
              providedLink={trainer.providedLink}
            />
            <div className={`trainer-frame ${showTrainer ? '' : 'trainer-frame--empty'}`}>
              {showTrainer ? (
                <img
                  draggable="false"
                  src={trainer.trainerSpriteUrl}
                  alt={trainerAlt(hintsRevealed, gameOver, trainer)}
                  className={`trainer-sprite ${gameOver === 'won' ? 'trainer-sprite--celebrate' : ''}`}
                  style={{ filter: trainerFilter }}
                />
              ) : (
                <div className="trainer-placeholder" aria-hidden="true">
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
          {gameOver && (
            <div className="timer-desktop">
              <CountdownTimer />
            </div>
          )}
        </div>

        <div className="right-panel">
          <TeamGrid team={trainer.team} revealed={hintsRevealed >= 1} />

          {!gameOver ? (
            <div className="guess-section">
              <GuessInput onGuess={handleGuess} onPass={handlePass} disabled={!!gameOver} />
              <div className="guess-counter">
                {MAX_GUESSES - guesses.length} guess{MAX_GUESSES - guesses.length !== 1 ? 'es' : ''} remaining
              </div>
            </div>
          ) : (
            <div ref={resultRef}>
              <DailyResult
                gameOver={gameOver}
                guesses={guesses}
                trainer={trainer}
                maxGuesses={MAX_GUESSES}
                onPlayConnections={onPlayConnections}
              />
            </div>
          )}
          <GuessAnnouncer guesses={guesses} gameOver={gameOver} trainer={trainer} maxGuesses={MAX_GUESSES} />

          {gameOver && user && saveStatus === 'failed' && (
            <div className="guess-counter" role="status">
              Couldn't save your result to your account yet. It's kept on this device and we'll keep retrying.
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

          {gameOver && (
            <div className="timer-mobile">
              <CountdownTimer />
            </div>
          )}

        </div>
      </main>
    </>
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
          <div className={`trainer-frame ${showTrainer ? '' : 'trainer-frame--empty'}`}>
            {showTrainer ? (
              <img
                draggable="false"
                src={trainer.trainerSpriteUrl}
                alt={trainer.name}
                className="trainer-sprite"
                style={{ filter: trainerFilter }}
              />
            ) : (
              <div className="trainer-placeholder" aria-hidden="true"><span>?</span></div>
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
            <div className="round-score-tag" aria-label={`${points} of ${MAX_GUESSES} points`}>{points}/{MAX_GUESSES}</div>
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
  'Gen 4': ['HeartGold/SoulSilver', 'Platinum', 'Battle Revolution'],
  'Gen 5': ['Black/White', 'Black2/White2'],
  'Gen 6': ['X/Y', 'Omega Ruby/Alpha Sapphire'],
  'Gen 7': ['Sun/Moon', 'Ultra Sun/Ultra Moon'],
  'Gen 8': ['Sword/Shield', 'Legends Arceus'],
  'Gen 9': ['Scarlet/Violet', 'Legends Z-A'],
}

const DIFFICULTIES = ['easy', 'medium', 'hard']

// Pulls from the same --badge-* vars as .difficulty-badge so both stay in sync and theme-reactive.
const DIFFICULTY_STYLES = {
  easy: {
    active: 'var(--badge-green-bg)',
    activeBorder: 'var(--badge-green-border)',
    activeColor: 'var(--green)',
    activeGlow: 'var(--badge-green-border)',
  },
  medium: {
    active: 'var(--badge-gold-bg)',
    activeBorder: 'var(--badge-gold-border)',
    activeColor: 'var(--gold)',
    activeGlow: 'var(--badge-gold-border)',
  },
  hard: {
    active: 'var(--badge-red-bg)',
    activeBorder: 'var(--badge-red-border)',
    activeColor: 'var(--red)',
    activeGlow: 'var(--badge-red-border)',
  },
}

// Paired versions are listed separately in the data (Ruby, Sapphire) but share one chip
const DISPLAY_MAP = {
  Ruby: 'Ruby/Sapphire', Sapphire: 'Ruby/Sapphire',
  Black: 'Black/White', White: 'Black/White',
  Black2: 'Black2/White2', White2: 'Black2/White2',
  Scarlet: 'Scarlet/Violet', Violet: 'Scarlet/Violet',
}

// One row per generation, each holding that generation's game chips in release order
function groupGames(allGames) {
  const chips = new Map()
  allGames.forEach(game => {
    const label = DISPLAY_MAP[game] || game
    if (!chips.has(label)) chips.set(label, [])
    chips.get(label).push(game)
  })
  const toChip = label => ({ label, originals: chips.get(label) })
  const rows = Object.entries(GEN_MAP)
    .map(([gen, labels]) => ({ gen, chips: labels.filter(l => chips.has(l)).map(toChip) }))
    .filter(row => row.chips.length > 0)
  const placed = new Set(Object.values(GEN_MAP).flat())
  const other = [...chips.keys()].filter(l => !placed.has(l))
  if (other.length > 0) rows.push({ gen: 'Other', chips: other.map(toChip) })
  return rows
}

const capitalise = s => s.charAt(0).toUpperCase() + s.slice(1)

function GameFilter({
  allGames, selectedGames, setSelectedGames, selectAllGames, activePool,
  selectedDifficulties, toggleDifficulty, selectAllDifficulties,
  enabledExtras, toggleExtra, EXTRAS_META,
}) {
  const rows = groupGames(allGames)
  const allSelected = selectedGames.size === allGames.length
  const noneSelected = selectedGames.size === 0
  const allDifficultiesSelected = selectedDifficulties.size === DIFFICULTIES.length

  const isOn = originals => originals.every(g => selectedGames.has(g))
  // Switching off the last games (with no extras on) would leave nothing to play
  const isLast = originals => isOn(originals) && selectedGames.size - originals.length <= 0 && enabledExtras.size === 0

  function setGames(originals, on) {
    const next = new Set(selectedGames)
    originals.forEach(g => (on ? next.add(g) : next.delete(g)))
    if (next.size === 0 && enabledExtras.size === 0) return
    setSelectedGames(next)
  }

  return (
    <div className="game-filter-panel" id="inf-options">

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
                aria-pressed={isActive}
                className={`difficulty-filter-btn ${isActive ? 'active' : ''} ${cantDeselect ? 'cant-deselect' : ''}`}
                style={isActive ? {
                  background: styles.active,
                  borderColor: styles.activeBorder,
                  color: styles.activeColor,
                  WebkitTextStroke: 'var(--badge-text-stroke)',
                } : {}}
                title={cantDeselect ? 'At least one difficulty must be selected' : ''}
              >
                {capitalise(diff)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-divider" />

      <div className="filter-section">
        <div className="filter-section-header">
          <span className="filter-section-label">Games</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAllGames}
              disabled={allSelected}
              className={`filter-ctrl-btn ${allSelected ? 'disabled' : 'accent'}`}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedGames(new Set())}
              disabled={noneSelected || allGames.length === 0}
              className={`filter-ctrl-btn ${noneSelected || allGames.length === 0 ? 'disabled' : ''}`}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="gen-rows">
          {rows.map(row => {
            const genGames = row.chips.flatMap(chip => chip.originals)
            const genOn = isOn(genGames)
            return (
              <div key={row.gen} className="gen-row">
                <button
                  onClick={() => setGames(genGames, !genOn)}
                  aria-pressed={genOn}
                  title={genOn ? `Turn off every ${row.gen} game` : `Turn on every ${row.gen} game`}
                  className={`gen-filter-btn ${genOn ? 'active' : ''} ${isLast(genGames) ? 'cant-deselect' : ''}`}
                >
                  {row.gen}
                </button>
                <div className="gen-row-games">
                  {row.chips.map(chip => {
                    const active = isOn(chip.originals)
                    return (
                      <button
                        key={chip.label}
                        onClick={() => setGames(chip.originals, !active)}
                        aria-pressed={active}
                        className={`game-filter-btn ${active ? 'active' : ''} ${isLast(chip.originals) ? 'cant-deselect' : ''}`}
                      >
                        <span aria-hidden="true">{active ? '✓' : '+'}</span>
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
              </div>
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
          {Object.keys(EXTRAS_META).map(key => {
            const meta = EXTRAS_META[key]
            const isActive = enabledExtras.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleExtra(key)}
                aria-pressed={isActive}
                className={`extras-filter-btn ${isActive ? 'active' : ''}`}
              >
                <span aria-hidden="true">{isActive ? '✓' : '+'}</span>
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

// "all games at all difficulties", or how far the pool has been narrowed down
function poolSummary({ allGames, selectedGames, selectedDifficulties, enabledExtras, EXTRAS_META }) {
  const chips = groupGames(allGames).flatMap(row => row.chips)
  const onChips = chips.filter(chip => chip.originals.every(g => selectedGames.has(g))).length
  const games = selectedGames.size === allGames.length ? 'all games'
    : onChips === 0 ? 'no main-series games'
    : `${onChips} of ${chips.length} games`
  const diffs = selectedDifficulties.size === DIFFICULTIES.length ? 'all difficulties'
    : `${DIFFICULTIES.filter(d => selectedDifficulties.has(d)).map(capitalise).join(' and ')} difficulty`
  const extras = [...enabledExtras].map(key => EXTRAS_META[key].label)
  return { games, diffs, extras }
}

function InfiniteMode({ onResetSession }) {
  const {
    allGames, selectedGames, setSelectedGames, selectAllGames, activePool,
    selectedDifficulties, toggleDifficulty, selectAllDifficulties,
    enabledExtras, toggleExtra, EXTRAS_META,
    rounds, poolCompletion,
    currentTrainer, currentGuesses, currentHints, currentGameOver, isTransitioning,
    handleGuess, handlePass, advanceRound, resetGame,
    MAX_GUESSES,
    totalScore, totalPossible, scoreForRound,
    totalElapsedSeconds, roundElapsedSeconds, finalRoundElapsedSeconds, startTimer, stopTimer,
  } = useInfiniteMode()

  const [isPlaying, setIsPlaying] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const scrollRef = useRef(null)
  const currentRef = useRef(null)
  const { save: saveMedals, refresh: refreshMedals } = useMedals()
  // Every round finished this session, for Infinite medals. Settings can't change mid-session.
  const medalLogRef = useRef([])

  useEffect(() => {
    if (!currentGameOver) return
    medalLogRef.current.push({
      trainerId: currentTrainer.id,
      won: currentGameOver === 'won',
      guesses: currentGuesses.length,
      seconds: finalRoundElapsedSeconds ?? roundElapsedSeconds,
      totalSeconds: totalElapsedSeconds,
    })
    saveMedals(infiniteSessionProgress(medalLogRef.current, {
      games: selectedGames, difficulties: selectedDifficulties, extras: enabledExtras,
    }))
    // The 10th round today may complete Triple Threat
    if (countInfiniteRound() === 10) refreshMedals()
    // Only runs when a round ends; the other values are read at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGameOver])

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
    const summary = poolSummary({ allGames, selectedGames, selectedDifficulties, enabledExtras, EXTRAS_META })
    return (
      <div className="inf-root">
        <div className="inf-start">
          <p className="inf-start-summary">
            Guess trainers from <strong>{summary.games}</strong> at <strong>{summary.diffs}</strong>
            {summary.extras.length > 0 && <>, plus <strong>{summary.extras.join(', ')}</strong></>}.
            {' '}{activePool.length} trainer{activePool.length !== 1 ? 's' : ''} in the pool.
          </p>
          <div className="inf-start-actions">
            <button
              onClick={handleStartGame}
              disabled={activePool.length === 0}
              className={`primary-btn ${activePool.length === 0 ? 'disabled' : ''}`}
            >
              Start Game
            </button>
            {/* A disclosure: the chevron turns over when the game options are open */}
            <button
              type="button"
              className={`back-btn inf-start-customise ${showOptions ? 'open' : ''}`}
              aria-expanded={showOptions}
              aria-controls="inf-options"
              onClick={() => setShowOptions(o => !o)}
            >
              Choose games
              <svg className="inf-start-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
        {showOptions && <GameFilter
          allGames={allGames}
          selectedGames={selectedGames}
          setSelectedGames={setSelectedGames}
          selectAllGames={selectAllGames}
          activePool={activePool}
          selectedDifficulties={selectedDifficulties}
          toggleDifficulty={toggleDifficulty}
          selectAllDifficulties={selectAllDifficulties}
          enabledExtras={enabledExtras}
          toggleExtra={toggleExtra}
          EXTRAS_META={EXTRAS_META}
        />}
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
            <Fragment key={i}>
              <CompletedRound round={round} scoreForRound={scoreForRound} MAX_GUESSES={MAX_GUESSES} />
              {poolCompletion?.afterRound === i + 1 && (
                <div className="pool-complete" role="status">
                  All trainers in this pool completed! <span className="pool-complete-time">{formatTime(poolCompletion.seconds)}</span>
                </div>
              )}
            </Fragment>
          ))}

          <div
            ref={currentRef}
            className={`inf-round inf-round--current ${isTransitioning ? 'inf-round--exiting' : 'inf-round--entering'}`}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '32px 0 20px 0', position: 'relative'
            }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: 'var(--panel-border)' }} />
              <span className="round-label">
                Round {rounds.length + 1}
              </span>
            </div>

            <div className="inf-round-inner main-layout">
              <div className="trainer-panel">
                <div className={`trainer-frame ${showTrainer ? '' : 'trainer-frame--empty'}`}>
                  {showTrainer ? (
                    <img
                      draggable="false"
                      src={currentTrainer.trainerSpriteUrl}
                      alt={trainerAlt(currentHints, currentGameOver, currentTrainer)}
                      className={`trainer-sprite ${currentGameOver === 'won' ? 'trainer-sprite--celebrate' : ''}`}
                      style={{ filter: trainerFilter }}
                    />
                  ) : (
                    <div className="trainer-placeholder" aria-hidden="true"><span>?</span></div>
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
                    <GuessInput
                      onGuess={handleGuess}
                      onPass={handlePass}
                      disabled={!!currentGameOver}
                      enabledExtras={enabledExtras}
                      extrasMeta={EXTRAS_META}
                    />
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
                          : `Not this time. It was ${currentTrainer.name}!`}
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

                <GuessAnnouncer guesses={currentGuesses} gameOver={currentGameOver} trainer={currentTrainer} maxGuesses={MAX_GUESSES} />

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

const MODES = [
  { id: 'daily', label: 'Daily' },
  { id: 'infinite', label: 'Infinite' },
  { id: 'connections', label: 'Connections' },
]

export default function Home() {
  // ?mode=connections (or infinite) opens that mode directly, e.g. from a shared result
  const [mode, setMode] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('mode')
    return MODES.some(m => m.id === requested) ? requested : 'daily'
  })
  const [infiniteKey, setInfiniteKey] = useState(0)
  // Set when a finished Daily puzzle sends the player to today's Connections
  const [connectionsTab, setConnectionsTab] = useState(null)

  function playTodaysConnections() {
    setConnectionsTab('daily')
    setMode('connections')
    window.scrollTo({ top: 0 })
  }

  const handleResetInfiniteSession = () => {
    setInfiniteKey(prev => prev + 1)
  }

  const modeIndex = MODES.findIndex(m => m.id === mode)

  return (
    <>
      <div className="mode-toggle-row">
        <div className="mode-toggle" role="tablist" aria-label="Game mode">
          <div
            className="mode-toggle-slider"
            aria-hidden="true"
            style={{ transform: `translateX(${modeIndex * 100}%)` }}
          />
          {MODES.map(m => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`mode-toggle-btn ${mode === m.id ? 'active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'daily' && <DailyMode onPlayConnections={playTodaysConnections} />}
      {mode === 'infinite' && (
        <InfiniteMode
          key={infiniteKey}
          onResetSession={handleResetInfiniteSession}
        />
      )}
      {mode === 'connections' && <ConnectionsMode initialTab={connectionsTab} />}
    </>
  )
}
