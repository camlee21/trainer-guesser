import { useState, useRef, useEffect } from 'react'
import TeamGrid from './components/TeamGrid'
import GuessInput from './components/GuessInput'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useDailyTrainer } from './hooks/useDailyTrainer'
import { usePersistedGameState } from './hooks/usePersistedGameState'
import { useInfiniteMode } from './hooks/useInfiniteMode'

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

// ── Colour utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function isDark(hex) {
  return luminance(hexToRgb(hex)) < 0.35
}

function applyBackground(hex) {
  const { r, g, b } = hexToRgb(hex)
  const dark = isDark(hex)

  const factor = dark ? 1.3 : 0.8
  const r2 = Math.min(255, Math.round(r * factor))
  const g2 = Math.min(255, Math.round(g * factor))
  const b2 = Math.min(255, Math.round(b * factor))

  const text     = dark ? '#e2e8f0' : '#1e293b'
  const textDim  = dark ? '#94a3b8' : '#475569'
  const green    = dark ? '#4ade80' : '#16a34a'
  const greenDk  = dark ? '#16a34a' : '#166534'
  const greenHov = dark ? '#22c55e' : '#15803d'
  const gold     = dark ? '#fbbf24' : '#b45309'

  const root = document.documentElement
  root.style.setProperty('--bg-main', `rgb(${r},${g},${b})`)
  root.style.setProperty('--bg-alt',  `rgb(${r2},${g2},${b2})`)
  root.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${dark ? '0.75' : '0.55'})`)
  root.style.setProperty('--panel-border', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)')
  root.style.setProperty('--input-bg', dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
  root.style.setProperty('--text', text)
  root.style.setProperty('--text-dim', textDim)
  root.style.setProperty('--green', green)
  root.style.setProperty('--green-dark', greenDk)
  root.style.setProperty('--green-hover', greenHov)
  root.style.setProperty('--gold', gold)
  root.style.setProperty('--suggestions-bg', dark ? 'rgba(15,23,42,0.97)' : 'rgba(248,250,252,0.98)')
}

const DEFAULT_COLOR = '#0d1b2a'

// ── ColourPicker ──────────────────────────────────────────────────────────────

function ColourPicker({ color, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const presets = [
    '#0d1b2a', // Default Navy
    '#ffffff', // White
    '#121212', // Black
    '#1e3a8a', // Blue
    '#064e3b', // Green
    '#7f1d1d', // Red
    '#fef08a', // Yellow
    '#4c1d95', // Purple
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        title="Choose background colour"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.16)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Colour wheel SVG */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="var(--text)" strokeWidth="1.5" fill="none"/>
          {[
            ['#ef4444', 0], ['#f97316', 60], ['#eab308', 120],
            ['#22c55e', 180], ['#3b82f6', 240], ['#a855f7', 300]
          ].map(([c, angle]) => {
            const rad = (angle - 90) * Math.PI / 180
            return (
              <circle
                key={angle}
                cx={11 + 5.5 * Math.cos(rad)}
                cy={11 + 5.5 * Math.sin(rad)}
                r="2.5"
                fill={c}
              />
            )
          })}
          <circle cx="11" cy="11" r="2" fill="var(--text)" opacity="0.6"/>
        </svg>
        {/* Live swatch dot */}
        <span style={{
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          border: '1.5px solid rgba(255,255,255,0.5)',
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(15,23,42,0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          minWidth: '176px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Background Colour
          </span>

          {/* Big round colour input */}
          <label style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'block',
            position: 'relative',
          }}>
            <input
              type="color"
              value={color}
              onChange={e => onChange(e.target.value)}
              style={{
                position: 'absolute',
                inset: '-10px',
                width: 'calc(100% + 20px)',
                height: 'calc(100% + 20px)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          </label>

          {/* Preset swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {presets.map(c => (
              <button
                key={c}
                title={c}
                onClick={() => onChange(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: c,
                  border: color === c ? '2px solid #72a4f2' : '1.5px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: color === c ? '0 0 8px rgba(114,164,242,0.5)' : 'none',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </div>

          <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', fontFamily: 'monospace' }}>
            {color.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

// ── DailyMode ─────────────────────────────────────────────────────────────────

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

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('daily')
  const [infiniteKey, setInfiniteKey] = useState(0)
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem('wtt-bg-color') || DEFAULT_COLOR
  })

  // Apply background on mount and whenever color changes
  useEffect(() => {
    applyBackground(bgColor)
  }, [bgColor])

  function handleColorChange(hex) {
    setBgColor(hex)
    localStorage.setItem('wtt-bg-color', hex)
  }

  const handleResetInfiniteSession = () => {
    setInfiniteKey(prev => prev + 1)
  }

  return (
    <div className="app-root">
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>

          {/* LEFT — colour picker */}
          <ColourPicker color={bgColor} onChange={handleColorChange} />

          {/* CENTRE — title */}
          <div style={{ textAlign: 'center' }}>
            <h1 className="title" style={{ margin: 0 }}>Who's that Trainer?</h1>
            <p className="subtitle" style={{ margin: '5px 0 0 0' }}>Guess the trainer from their team</p>
          </div>

          {/* RIGHT — Ko-fi */}
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
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = '0px 6px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <img
              src="https://storage.ko-fi.com/cdn/cup-border.png"
              alt="Ko-fi cup"
              style={{ height: '18px', width: 'auto', display: 'initial' }}
            />
            <span>Support me on Ko-fi</span>
          </a>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            width: '280px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              bottom: '4px',
              width: 'calc(50% - 4px)',
              backgroundColor: '#72a4f2',
              borderRadius: '9999px',
              transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: mode === 'infinite' ? 'translateX(100%)' : 'translateX(0%)',
              boxShadow: '0 4px 12px rgba(114, 164, 242, 0.35)',
              zIndex: 1
            }} />

            <button
              onClick={() => setMode('daily')}
              style={{
                flex: 1,
                position: 'relative',
                zIndex: 2,
                background: 'none',
                border: 'none',
                color: mode === 'daily' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                padding: '10px 0',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'color 0.2s ease'
              }}
            >
              <span>📅</span> Daily
            </button>

            <button
              onClick={() => setMode('infinite')}
              style={{
                flex: 1,
                position: 'relative',
                zIndex: 2,
                background: 'none',
                border: 'none',
                color: mode === 'infinite' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                padding: '10px 0',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'color 0.2s ease'
              }}
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
      </div>

      <Analytics />
      <SpeedInsights />
    </div>
  )
}

// ── CompletedRound ────────────────────────────────────────────────────────────

function CompletedRound({ round }) {
  const { trainer, guesses, gameOver, hints } = round
  const trainerFilter = hints >= 4 ? 'none' : 'brightness(0) contrast(1)'
  const showTrainer = hints >= 3

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
          <div className={`result-banner ${gameOver} inf-result-banner`}>
            {gameOver === 'won' ? `✓ ${trainer.name}` : `✗ ${trainer.name}`}
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

// ── GameFilter ────────────────────────────────────────────────────────────────

function GameFilter({ allGames, selectedGames, toggleGame, selectAllGames, activePool }) {
  const displayMap = {
    'Ruby': 'Ruby/Sapphire',
    'Sapphire': 'Ruby/Sapphire',
    'Black': 'Black/White',
    'White': 'Black/White',
    'Black2': 'Black2/White2',
    'White2': 'Black2/White2',
    'Scarlet': "Scarlet/Violet",
    'Violet': "Scarlet/Violet"
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

  const firstButtonGroup = visibleButtons[0]?.originals || []
  const isDeselectedState = selectedGames.size === firstButtonGroup.length &&
    firstButtonGroup.every(g => selectedGames.has(g))

  const handleGroupToggle = (group) => {
    const isCurrentlyActive = group.originals.every(g => selectedGames.has(g))

    if (isCurrentlyActive) {
      const activeCount = selectedGames.size
      const groupCount = group.originals.length
      if (activeCount - groupCount <= 0) {
        return;
      }
    }

    group.originals.forEach(g => {
      const active = selectedGames.has(g)
      if (isCurrentlyActive && active) {
        toggleGame(g)
      } else if (!isCurrentlyActive && !active) {
        toggleGame(g)
      }
    })
  }

  const handleDeselectAll = () => {
    if (visibleButtons.length === 0) return
    const firstGroup = visibleButtons[0].originals

    allGames.forEach(g => {
      const insideFirst = firstGroup.includes(g)
      const isActive = selectedGames.has(g)
      if (insideFirst && !isActive) {
        toggleGame(g)
      } else if (!insideFirst && isActive) {
        toggleGame(g)
      }
    })
  }

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      fontFamily: 'inherit'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#ffffff' }}>Filter Games</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={selectAllGames}
            disabled={allSelected}
            style={{
              background: allSelected ? 'rgba(255, 255, 255, 0.05)' : '#72a4f2',
              color: allSelected ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: allSelected ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={isDeselectedState || allGames.length === 0}
            style={{
              background: isDeselectedState || allGames.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              color: isDeselectedState || allGames.length === 0 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isDeselectedState || allGames.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Deselect All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {visibleButtons.map(group => {
          const isActive = group.originals.every(g => selectedGames.has(g))
          const isDisableCandidate = isActive && (selectedGames.size - group.originals.length <= 0);

          return (
            <button
              key={group.label}
              onClick={() => handleGroupToggle(group)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isActive ? '#72a4f2' : 'rgba(255, 255, 255, 0.06)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                border: `1px solid ${isActive ? '#72a4f2' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isDisableCandidate ? 'not-allowed' : 'pointer',
                opacity: isDisableCandidate ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 8px rgba(114, 164, 242, 0.3)' : 'none'
              }}
            >
              <span>{isActive ? '✓' : '＋'}</span>
              {group.label}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '5px' }}>
        {activePool.length} trainer{activePool.length !== 1 ? 's' : ''} available with current selections
      </div>
    </div>
  )
}

// ── InfiniteMode ──────────────────────────────────────────────────────────────

function InfiniteMode({ onResetSession }) {
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

  useEffect(() => {
    if (isPlaying && !isTransitioning && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [rounds.length, isTransitioning, isPlaying])

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
    <div className="inf-root" style={{ width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleBackToFilters}
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
          ← Back to Filters
        </button>
      </div>

      <div className="inf-scroll" ref={scrollRef}>
        {rounds.map((round, i) => (
          <CompletedRound key={i} round={round} />
        ))}

        <div
          ref={currentRef}
          className={`inf-round inf-round--current ${isTransitioning ? 'inf-round--exiting' : 'inf-round--entering'}`}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '32px 0 20px 0',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{
              position: 'relative',
              backgroundColor: '#1a1a1a',
              padding: '4px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#72a4f2',
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
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
                    <GuessInput onGuess={handleGuess} disabled={!!currentGameOver} />
                  </div>
                  <div className="guess-counter">
                    {MAX_GUESSES - currentGuesses.length} guess{MAX_GUESSES - currentGuesses.length !== 1 ? 'es' : ''} remaining
                  </div>
                </div>
              ) : (
                <div className="inf-gameover-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className={`result-banner ${currentGameOver}`} style={{ flex: 1, margin: 0 }}>
                    {currentGameOver === 'won'
                      ? `You got it! It was ${currentTrainer.name}!`
                      : `Game Over! It was ${currentTrainer.name}!`}
                  </div>
                  <button
                    className="next-btn"
                    onClick={advanceRound}
                    style={{
                      backgroundColor: '#72a4f2',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(114, 164, 242, 0.3)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
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
    </div>
  )
}