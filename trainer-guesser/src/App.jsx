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

function applyBackground(hex, accentHex) {
  const { r, g, b } = hexToRgb(hex)
  const dark = isDark(hex)

  const factor = dark ? 1.3 : 0.8
  const r2 = Math.min(255, Math.round(r * factor))
  const g2 = Math.min(255, Math.round(g * factor))
  const b2 = Math.min(255, Math.round(b * factor))

  const text = dark ? '#e2e8f0' : '#1e293b'
  const textDim = dark ? '#94a3b8' : '#475569'
  const green = dark ? '#4ade80' : '#16a34a'
  const greenDk = dark ? '#16a34a' : '#166534'
  const greenHov = dark ? '#22c55e' : '#15803d'
  const gold = dark ? '#fbbf24' : '#b45309'

  // Derive accent glow & hover shades
  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  const accentGlow = `rgba(${ar},${ag},${ab},0.35)`
  const accentHover = accentHex  // callers can override with a lighter variant if desired
  const accentBg = `rgba(${ar},${ag},${ab},0.15)`
  const accentBorder = `rgba(${ar},${ag},${ab},0.35)`

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

  // Accent variables
  root.style.setProperty('--accent', accentHex)
  root.style.setProperty('--accent-glow', accentGlow)
  root.style.setProperty('--accent-hover', accentHover)
  root.style.setProperty('--accent-bg', accentBg)
  root.style.setProperty('--accent-border', accentBorder)
  root.style.setProperty('--accent-text', dark ? '#ffffff' : '#ffffff')
}

const DEFAULT_COLOR = '#0d1b2a'
const DEFAULT_ACCENT = '#72a4f2'

// Each preset bg colour paired with a complementary accent colour
const PRESETS = [
  { bg: '#0d1b2a', accent: '#72a4f2', label: 'Navy' },
  { bg: '#ffffff', accent: '#3b82f6', label: 'White' },
  { bg: '#121212', accent: '#a855f7', label: 'Black' },
  { bg: '#1e3a8a', accent: '#60c0f8', label: 'Blue' },
  { bg: '#064e3b', accent: '#4ade80', label: 'Green' },
  { bg: '#7f1d1d', accent: '#fb923c', label: 'Red' },
  { bg: '#fef08a', accent: '#ca8a04', label: 'Yellow' },
  { bg: '#4c1d95', accent: '#f0abfc', label: 'Purple' },
]

function ColourPicker({ color, accent, onBgChange, onAccentChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        title="Choose background & accent colour"
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
        {/* Live swatch dots — bg & accent split */}
        <span style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color} 50%, ${accent} 50%)`,
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
          padding: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          minWidth: '210px',
        }}>

          {/* Preset pairs */}
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Theme Presets
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px', width: '100%' }}>
            {PRESETS.map(p => {
              const isSelected = color === p.bg
              return (
                <button
                  key={p.bg}
                  title={p.label}
                  onClick={() => { onBgChange(p.bg); onAccentChange(p.accent) }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${p.bg} 55%, ${p.accent} 55%)`,
                    border: isSelected ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 10px rgba(255,255,255,0.4)` : 'none',
                    transition: 'transform 0.1s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Custom pickers */}
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Custom
          </span>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            {/* Background */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BG</span>
              <label style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                cursor: 'pointer', display: 'block', position: 'relative',
              }}>
                <input type="color" value={color} onChange={e => onBgChange(e.target.value)}
                  style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{color.toUpperCase()}</span>
            </div>

            {/* Arrow */}
            <span style={{ color: '#475569', fontSize: '16px', marginTop: '4px' }}>⇄</span>

            {/* Accent */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accent</span>
              <label style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${accent}`, boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 10px ${accent}55`,
                cursor: 'pointer', display: 'block', position: 'relative',
              }}>
                <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)}
                  style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{accent.toUpperCase()}</span>
            </div>
          </div>
        </div>
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

export default function App() {
  const [mode, setMode] = useState('daily')
  const [infiniteKey, setInfiniteKey] = useState(0)
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem('wtt-bg-color') || DEFAULT_COLOR
  })
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('wtt-accent-color') || DEFAULT_ACCENT
  })

  useEffect(() => {
    applyBackground(bgColor, accentColor)
  }, [bgColor, accentColor])

  function handleBgChange(hex) {
    setBgColor(hex)
    localStorage.setItem('wtt-bg-color', hex)
  }

  function handleAccentChange(hex) {
    setAccentColor(hex)
    localStorage.setItem('wtt-accent-color', hex)
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
          <ColourPicker
            color={bgColor}
            accent={accentColor}
            onBgChange={handleBgChange}
            onAccentChange={handleAccentChange}
          />

          {/* CENTRE — title */}
          <div style={{ textAlign: 'center' }}>
            <h1 className="title" style={{ margin: 0 }}>Who's that Trainer?</h1>
            <p className="subtitle" style={{ margin: '5px 0 0 0' }}>Guess the trainer from their team</p>
          </div>

          {/* RIGHT — Twitter + Ko-fi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="https://x.com/drag1ash"
              target="_blank"
              rel="noopener noreferrer"
              title="Twitter / X"
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
                transition: 'background 0.2s, transform 0.15s',
                flexShrink: 0,
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://ko-fi.com/I8P7210YG4"
              target="_blank"
              rel="noopener noreferrer"
              className="kofi-btn"
            >
              <img
                src="https://storage.ko-fi.com/cdn/cup-border.png"
                alt="Ko-fi cup"
                style={{ height: '18px', width: 'auto', display: 'initial' }}
              />
              <span>Support me on Ko-fi</span>
            </a>
          </div>
        </header>

        {/* Mode toggle */}
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

        {mode === 'daily' && (
          <p className="game-description">
            Welcome to Who's That Trainer! Try and guess the main-series trainer by their Pokémon team
            in 5 guesses, with a new trainer every day to try and figure out. Guessing incorrectly will
            reveal more clues to you, such as the revealed Pokémon team, the game of origin, the type
            of trainer, and finally, the trainer's appearance. Trainers range from easy to hard in
            difficulty; some days your game knowledge will really be tested! I am always trying to add
            more trainers and improve the website - if you have any feedback or suggestions please DM
            me on Twitter, linked above. Have a great day, and good luck!
          </p>
        )}
      </div>

      <Analytics />
      <SpeedInsights />
    </div>
  )
}

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

function GameFilter({ allGames, selectedGames, toggleGame, replaceSelectedGames, selectAllGames, activePool }) {
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

  const buttonByLabel = {}
  visibleButtons.forEach(b => { buttonByLabel[b.label] = b })

  const allSelected = selectedGames.size === allGames.length

  const firstButtonGroup = visibleButtons[0]?.originals || []
  const isDeselectedState = selectedGames.size === firstButtonGroup.length &&
    firstButtonGroup.every(g => selectedGames.has(g))

  const handleGroupToggle = (group) => {
    const isCurrentlyActive = group.originals.every(g => selectedGames.has(g))
    if (isCurrentlyActive) {
      if (selectedGames.size - group.originals.length <= 0) return
    }
    group.originals.forEach(g => {
      const active = selectedGames.has(g)
      if (isCurrentlyActive && active) toggleGame(g)
      else if (!isCurrentlyActive && !active) toggleGame(g)
    })
  }

  const handleDeselectAll = () => {
    if (visibleButtons.length === 0) return
    const firstGroup = visibleButtons[0].originals
    allGames.forEach(g => {
      const insideFirst = firstGroup.includes(g)
      const isActive = selectedGames.has(g)
      if (insideFirst && !isActive) toggleGame(g)
      else if (!insideFirst && isActive) toggleGame(g)
    })
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
    if (newSet.size === 0) return
    replaceSelectedGames(newSet)

    setActiveGens(newActiveGens)
  }

  const availableGens = Object.keys(GEN_MAP).filter(gen =>
    (GEN_MAP[gen] || []).some(label =>
      allGames.some(g => (rawToDisplay[g] || g) === label)
    )
  )


  return (
    <div className="game-filter-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>Filter Games</span>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {visibleButtons.map(group => {
          const isActive = group.originals.every(g => selectedGames.has(g))
          const isDisableCandidate = isActive && (selectedGames.size - group.originals.length <= 0)
          return (
            <button
              key={group.label}
              onClick={() => {
                handleGroupToggle(group)
                setActiveGens(new Set())
              }}
              className={`game-filter-btn ${isActive ? 'active' : ''} ${isDisableCandidate ? 'cant-deselect' : ''}`}
            >
              <span>{isActive ? '✓' : '＋'}</span>
              {group.label}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
        {activePool.length} trainer{activePool.length !== 1 ? 's' : ''} available with current selections
      </div>
    </div>
  )
}

function InfiniteMode({ onResetSession }) {
  const {
    allGames, selectedGames, toggleGame, replaceSelectedGames, selectAllGames, activePool,
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
          replaceSelectedGames={replaceSelectedGames}
          selectAllGames={selectAllGames}
          activePool={activePool}
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
      <div style={{ marginBottom: '24px' }}>
        <button onClick={handleBackToFilters} className="back-btn">
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
                    <GuessInput onGuess={handleGuess} disabled={!!currentGameOver} />
                  </div>
                  <div className="guess-counter">
                    {MAX_GUESSES - currentGuesses.length} guess{MAX_GUESSES - currentGuesses.length !== 1 ? 'es' : ''} remaining
                  </div>
                </div>
              ) : (
                <div className="inf-gameover-row">
                  <div className={`result-banner ${currentGameOver}`} style={{ flex: 1, margin: 0 }}>
                    {currentGameOver === 'won'
                      ? `You got it! It was ${currentTrainer.name}!`
                      : `Game Over! It was ${currentTrainer.name}!`}
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
    </div>
  )
}