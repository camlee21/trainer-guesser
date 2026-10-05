import { useState, useEffect, useRef, useCallback } from 'react'
import CountdownTimer from './CountdownTimer'
import ShareButtons from './ShareButtons'
import { ScrollToTopButton, ScrollToBottomButton } from './ScrollButtons'
import { getPokemonSpriteUrl } from '../utils/sprites'
import { useConnectionsGame } from '../hooks/useConnectionsGame'
import {
  CONNECTION_TRAINERS, TIME_LIMIT_MS, getTrainer, getTeamOptions, getTrainersUsing, pokemonName, trainerLabel,
} from '../lib/connectionsGraph'

const SEARCH_OPTIONS = CONNECTION_TRAINERS.map(t => ({ id: t.id, label: trainerLabel(t), name: t.name.toLowerCase() }))
const TAB_KEY = 'wtt-connections-tab'
// Set once the visitor has closed the popup explaining the timed rules
const RULES_SEEN_KEY = 'wtt-connections-timed-seen'

// Same ordering as the guess box: exact name, then name starts with, then name contains, then game matches
function searchTrainers(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const rank = o => (o.name === q ? 0 : o.name.startsWith(q) ? 1 : o.name.includes(q) ? 2 : 3)
  return SEARCH_OPTIONS
    .filter(o => o.label.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Picks a trainer as soon as one is chosen; there's no separate confirm button like the guess box has
function TrainerSearch({ onSelect, placeholder }) {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(-1)
  const [open, setOpen] = useState(false)
  const matches = open ? searchTrainers(query) : []

  function pick(option) {
    onSelect(option.id)
    setQuery('')
    setOpen(false)
    setHighlight(-1)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (matches.length === 0) {
      return
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      pick(matches[Math.max(highlight, 0)])
    }
  }

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(-1) }}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        className="search-input cx-search"
        autoComplete="off"
        aria-label={placeholder}
      />
      {matches.length > 0 && (
        <ul className="suggestions-list">
          {matches.map((o, i) => (
            <li
              key={o.id}
              onMouseDown={e => { e.preventDefault(); pick(o) }}
              className={`suggestion-item ${i === highlight ? 'highlighted' : ''}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TeamStrip({ trainerId }) {
  return (
    <div className="cx-team-strip">
      {getTeamOptions(trainerId).map(p => (
        <img key={p.pokedexId} src={getPokemonSpriteUrl(p.pokedexId)} alt={p.name} title={p.name} draggable="false" />
      ))}
    </div>
  )
}

function EndpointCard({ role, trainer, onPick, onRandom }) {
  const title = role === 'start' ? 'Start' : 'Goal'
  return (
    <section className={`cx-endpoint cx-endpoint--${role}`} aria-label={`${title} trainer`}>
      <div className="cx-endpoint-head">
        <span className="cx-endpoint-role">{title}</span>
        <button className="filter-ctrl-btn" onClick={onRandom}>Random</button>
      </div>
      <div className="cx-endpoint-portrait">
        <img key={trainer.id} src={trainer.trainerSpriteUrl} alt={trainer.name} draggable="false" />
      </div>
      <div className="cx-endpoint-name">{trainer.name}</div>
      <div className="cx-endpoint-game">{trainer.game}</div>
      <TeamStrip trainerId={trainer.id} />
      <TrainerSearch onSelect={onPick} placeholder={`Choose a ${title.toLowerCase()} trainer...`} />
    </section>
  )
}

function isolated(trainer) {
  return getTeamOptions(trainer.id).every(p => p.otherTrainers === 0)
}

const RULES = 'Pick one of a trainer\'s Pokémon, then another trainer who uses it, and repeat until you reach the goal. The timer starts with your first pick, and undoing is free. Connect them as fast as you can!'

function Setup({ game }) {
  const { start, goal, setupProblem, setEndpoint, swapEndpoints, randomise, startGame } = game

  let notice = null
  if (setupProblem === 'same') {
    notice = 'Pick two different trainers.'
  } else if (setupProblem === 'unreachable') {
    const loner = [start, goal].find(isolated)
    notice = loner
      ? `${trainerLabel(loner)} doesn't share a Pokémon with any other trainer yet, so they can't be connected. Pick someone else.`
      : `There's no chain of shared Pokémon between ${start.name} and ${goal.name}. Try another pair.`
  }

  return (
    <div className="cx-setup">
      <p className="cx-lede">Choose any two trainers, or roll a random pair. {RULES}</p>

      <div className="cx-endpoints">
        <EndpointCard role="start" trainer={start} onPick={id => setEndpoint('start', id)} onRandom={() => randomise('start')} />
        <button className="cx-swap" onClick={swapEndpoints} aria-label="Swap start and goal" title="Swap start and goal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 16l-4-4 4-4M3 12h18M17 8l4 4-4 4" />
          </svg>
        </button>
        <EndpointCard role="goal" trainer={goal} onPick={id => setEndpoint('goal', id)} onRandom={() => randomise('goal')} />
      </div>

      {notice && <div className="cx-notice" role="status">{notice}</div>}

      <div className="cx-setup-actions">
        <button className="back-btn" onClick={() => randomise('both')}>Shuffle both</button>
        <button
          className={`primary-btn ${setupProblem ? 'disabled' : ''}`}
          disabled={!!setupProblem}
          onClick={startGame}
        >
          Start
        </button>
      </div>
    </div>
  )
}

function TrainerNode({ trainer, isGoal = false }) {
  return (
    <span className={`cx-node ${isGoal ? 'is-goal' : ''}`}>
      <span className="cx-node-art">
        <img src={trainer.trainerSpriteUrl} alt="" draggable="false" />
      </span>
      <span className="cx-node-text">
        <span className="cx-node-name">{trainer.name}</span>
        <span className="cx-node-sub">{trainer.game}</span>
      </span>
    </span>
  )
}

function PokemonNode({ pokedexId }) {
  return (
    <span className="cx-node">
      <span className="cx-node-art">
        <img src={getPokemonSpriteUrl(pokedexId)} alt="" draggable="false" />
      </span>
      <span className="cx-node-text">
        <span className="cx-node-name">{pokemonName(pokedexId)}</span>
      </span>
    </span>
  )
}

function Arrow() {
  return (
    <svg className="cx-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

// Needs a second tap within a few seconds, so a stray tap can't throw the route away
function RestartButton({ onRestart }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  return (
    <button
      className={`back-btn cx-restart ${armed ? 'is-armed' : ''}`}
      onClick={() => (armed ? (setArmed(false), onRestart()) : setArmed(true))}
      onBlur={() => setArmed(false)}
    >
      {armed ? 'Tap again to restart' : 'Restart route'}
    </button>
  )
}

function UndoButton({ onUndo }) {
  const tip = 'Undo last step'
  return (
    <button className="cx-undo" onClick={onUndo} aria-label={tip} data-tip={tip}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 14L4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </svg>
    </button>
  )
}

function PokemonOptions({ trainerId, onChoose }) {
  return (
    <div className="cx-options cx-options--pokemon">
      {getTeamOptions(trainerId).map(p => {
        const deadEnd = p.otherTrainers === 0
        return (
          <button
            key={p.pokedexId}
            className="cx-option"
            onClick={() => onChoose(p.pokedexId)}
            disabled={deadEnd}
            title={deadEnd ? `No other trainer uses ${p.name}` : undefined}
          >
            <img className="cx-option-sprite" src={getPokemonSpriteUrl(p.pokedexId)} alt="" draggable="false" />
            <span className="cx-option-name">{p.name}</span>
            {deadEnd && <span className="cx-option-tag">No links</span>}
          </button>
        )
      })}
    </div>
  )
}

function TrainerOptions({ pokedexId, fromId, visited, goalId, onChoose }) {
  const [filter, setFilter] = useState('')
  // Trainers already on the route can't be revisited, so they sink to the end
  const options = getTrainersUsing(pokedexId, fromId)
    .sort((a, b) => visited.includes(a.id) - visited.includes(b.id))
  const q = filter.trim().toLowerCase()
  const shown = q ? options.filter(t => trainerLabel(t).toLowerCase().includes(q)) : options
  const allVisited = options.every(t => visited.includes(t.id))

  return (
    <>
      {options.length > 8 && (
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={`Filter ${options.length} trainers...`}
          className="search-input cx-filter"
          autoComplete="off"
          aria-label="Filter trainers"
        />
      )}
      {allVisited && (
        <p className="cx-empty">
          Everyone else who uses {pokemonName(pokedexId)} is already on your route. Undo to pick a different Pokémon.
        </p>
      )}
      <div className="cx-options cx-options--trainers">
        {shown.map(t => {
          const onRoute = visited.includes(t.id)
          const isGoal = t.id === goalId
          return (
            <button
              key={t.id}
              className={`cx-option ${isGoal ? 'is-goal' : ''}`}
              onClick={() => onChoose(t.id)}
              disabled={onRoute}
            >
              <img className="cx-option-sprite cx-option-sprite--trainer" src={t.trainerSpriteUrl} alt="" draggable="false" />
              <span className="cx-option-name">{t.name}</span>
              <span className="cx-option-sub">{t.game}</span>
              {isGoal && <span className="cx-option-tag cx-option-tag--goal">Goal</span>}
              {onRoute && <span className="cx-option-tag">On route</span>}
            </button>
          )
        })}
        {shown.length === 0 && <p className="cx-empty">No trainers match “{filter}”.</p>}
      </div>
    </>
  )
}

function RouteStrip({ route }) {
  return (
    <div className="cx-strip">
      {route.trainers.map((id, i) => (
        <span key={id} className="cx-strip-step">
          {i > 0 && (
            <>
              <PokemonNode pokedexId={route.pokemon[i - 1]} />
              <Arrow />
            </>
          )}
          <TrainerNode trainer={getTrainer(id)} isGoal={i === route.trainers.length - 1} />
          {i < route.trainers.length - 1 && <Arrow />}
        </span>
      ))}
    </div>
  )
}

// The one loud moment in the mode: the final score written out as a sum
// 00:56, stopping at 10:00
function formatTime(ms) {
  const secs = Math.floor(Math.min(Math.max(ms, 0), TIME_LIMIT_MS) / 1000)
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

// Ticks while the puzzle is being played; shows the final time once it's over
function Stopwatch({ startedAt, elapsedMs, finished }) {
  const [now, setNow] = useState(Date.now)
  const running = !!startedAt && !finished
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])
  if (finished) return elapsedMs == null ? '—' : formatTime(elapsedMs)
  return formatTime(startedAt ? now - startedAt : 0)
}

function ScoreCard({ won, perfect, hops, elapsedMs, best, goal, shareText }) {
  let headline = 'Answer revealed'
  let note = `The best possible score was ${best}!`
  if (perfect) {
    headline = 'Perfect route'
    note = `${plural(best, 'connection')} is the shortest possible route to ${goal.name}!`
  } else if (won) {
    headline = `Connected to ${goal.name}`
    note = `The best possible score is ${best}!`
  }

  return (
    <div className={`cx-scorecard ${perfect ? 'is-perfect' : won ? 'is-won' : 'is-lost'}`} role="status">
      <div className="cx-scorecard-headline">{headline}</div>
      {won && (
        <div className="cx-sum">
          <span className="cx-sum-term">
            <span className="cx-sum-num">{hops}</span>
            <span className="cx-sum-label">{hops === 1 ? 'connection' : 'connections'}</span>
          </span>
          {elapsedMs != null && (
            <>
              <span className="cx-sum-op">in</span>
              <span className="cx-sum-term">
                <span className="cx-sum-num">{formatTime(elapsedMs)}</span>
                <span className="cx-sum-label">time</span>
              </span>
            </>
          )}
        </div>
      )}
      <p className="cx-scorecard-note">{note}</p>
      {shareText && (
        <div className="cx-scorecard-share">
          <ShareButtons text={shareText} />
        </div>
      )}
    </div>
  )
}

// Opens straight onto the Daily tab, whichever tab the visitor used last
const DAILY_LINK = 'https://whosthattrainer.app/?mode=connections&tab=daily'

function dailyShareText({ dayNumber, won, score, best, elapsedMs }) {
  return [
    `Who's That Trainer? Connections #${dayNumber}`,
    won ? `Score: ${score} (min ${best})${elapsedMs != null ? ` in ${formatTime(elapsedMs)}` : ''}` : `Score: N/A (min ${best})`,
    `Try today's connection at: ${DAILY_LINK}`,
  ].join('\n')
}

function Play({ game, onPlayCustom }) {
  const {
    kind, phase, outcome, dayNumber, start, goal, trainers, pokemon, hops, score, startedAt, elapsedMs, bestRoute,
    canUndo, signedIn, saveStatus, choosePokemon, chooseTrainer, undo, restartRoute, giveUp, playRandom, backToSetup,
  } = game
  const daily = kind === 'daily'
  const finished = phase === 'finished'
  const won = outcome === 'won'
  const perfect = won && score === bestRoute.hops
  const focusRef = useRef(null)
  const progress = `${trainers.length}-${pokemon.length}-${finished}`
  const lastProgress = useRef(progress)

  // Follow the route down the page as it grows, like Infinite mode does with rounds,
  // but don't jump the page when a saved puzzle is first opened
  useEffect(() => {
    if (lastProgress.current === progress) return
    lastProgress.current = progress
    focusRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [progress])

  // Flint -> Houndoom, Houndoom -> Cyrus, Cyrus -> Gyarados, ... Once the game is over only answered rows
  // are kept, so the goal (or wherever the player stopped) doesn't leave an empty row at the end.
  const allRows = []
  trainers.forEach((trainerId, i) => {
    allRows.push({ kind: 'trainer', trainerId, choice: pokemon[i] })
    if (pokemon[i] !== undefined) allRows.push({ kind: 'pokemon', pokedexId: pokemon[i], choice: trainers[i + 1] })
  })
  const rows = finished ? allRows.filter(row => row.choice !== undefined) : allRows
  // While playing, the last row is the one being answered and the one above it is the one undo takes back
  const undoRow = !finished && canUndo ? rows.length - 2 : -1

  return (
    <div className="cx-play">
      {daily && !finished && trainers.length === 1 && pokemon.length === 0 && (
        <p className="cx-lede">Today's puzzle: connect {trainerLabel(start)} to {trainerLabel(goal)}. {RULES}</p>
      )}

      <div className="cx-topbar">
        {daily
          ? <span className="cx-day">Connections #{dayNumber}</span>
          : <button onClick={backToSetup} className="back-btn">Change trainers</button>}
        {!finished && (
          <div className="cx-topbar-actions">
            {pokemon.length > 0 && <RestartButton onRestart={restartRoute} />}
            <button onClick={giveUp} className="back-btn cx-giveup">Show answer</button>
          </div>
        )}
      </div>

      <div className="cx-play-layout">
        <div className="cx-main">
          <ol className="cx-chain">
            {rows.map((row, idx) => {
              const active = !finished && row.choice === undefined
              const done = row.choice !== undefined
              return (
                <li
                  key={idx}
                  ref={active ? focusRef : null}
                  className={`cx-row ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                >
                  <span className="cx-step" aria-hidden="true">{idx + 1}</span>
                  <div className="cx-row-card">
                    <div className="cx-row-line">
                      <div className="cx-row-pair">
                        {row.kind === 'trainer'
                          ? <TrainerNode trainer={getTrainer(row.trainerId)} />
                          : <PokemonNode pokedexId={row.pokedexId} />}
                        <Arrow />
                        {done ? (
                          row.kind === 'trainer'
                            ? <PokemonNode pokedexId={row.choice} />
                            : <TrainerNode trainer={getTrainer(row.choice)} isGoal={row.choice === goal.id} />
                        ) : (
                          <span className="cx-prompt">
                            {row.kind === 'trainer' ? 'Choose a Pokémon' : 'Choose a trainer'}
                          </span>
                        )}
                      </div>
                      {idx === undoRow && <UndoButton onUndo={undo} />}
                    </div>

                    {active && row.kind === 'trainer' && (
                      <PokemonOptions trainerId={row.trainerId} onChoose={choosePokemon} />
                    )}
                    {active && row.kind === 'pokemon' && (
                      <TrainerOptions
                        key={`${idx}-${row.pokedexId}`}
                        pokedexId={row.pokedexId}
                        fromId={trainers[trainers.length - 1]}
                        visited={trainers}
                        goalId={goal.id}
                        onChoose={chooseTrainer}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          {finished && (
            <div className="cx-result" ref={focusRef}>
              <ScoreCard
                won={won} perfect={perfect} hops={hops} elapsedMs={elapsedMs} best={bestRoute.hops} goal={goal}
                shareText={daily ? dailyShareText({ dayNumber, won, score, best: bestRoute.hops, elapsedMs }) : null}
              />

              {(!won || hops > bestRoute.hops) && (
                <div className="cx-best">
                  <div className="cx-best-title">One of the shortest routes</div>
                  <RouteStrip route={bestRoute} />
                </div>
              )}

              {daily && signedIn && saveStatus === 'failed' && (
                <p className="guess-counter cx-save-failed" role="status">
                  Couldn't save your result to your account yet. It's kept on this device and we'll keep retrying.
                </p>
              )}

              {daily ? (
                // Nothing left to do today, so point at the next thing: tomorrow's puzzle or a custom one now
                <div className="cx-daily-next">
                  <CountdownTimer label="Next daily puzzle in" />
                  <button className="primary-btn cx-daily-custom" onClick={onPlayCustom}>Play a custom puzzle</button>
                </div>
              ) : (
                <div className="cx-result-actions">
                  <button className="primary-btn next-btn" onClick={playRandom}>New random pair</button>
                  <button className="back-btn" onClick={backToSetup}>Pick trainers</button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="cx-sidebar" aria-label="Goal and score">
          <div className="cx-goal-card">
            <img className="cx-goal-sprite" src={goal.trainerSpriteUrl} alt="" draggable="false" />
            <div className="cx-goal-text">
              <div className="cx-goal-label">Goal</div>
              <div className="cx-goal-name">{goal.name}</div>
              <div className="cx-endpoint-game">{goal.game}</div>
            </div>
            <TeamStrip trainerId={goal.id} />
          </div>
          <div className="cx-sidebar-scores">
            <div className="score-badge">
              <span className="score-badge-label">Score</span>
              <span className="score-badge-value">{outcome === 'gaveup' ? '—' : score}</span>
            </div>
            <div className="score-badge">
              <span className="score-badge-label">Time</span>
              <span className="score-badge-value"><Stopwatch startedAt={startedAt} elapsedMs={elapsedMs} finished={finished} /></span>
            </div>
            <div className="score-badge">
              <span className="score-badge-label">Best</span>
              <span className="score-badge-value">{finished ? bestRoute.hops : '?'}</span>
            </div>
          </div>
        </aside>
      </div>

      <ScrollToTopButton />
      <ScrollToBottomButton />
    </div>
  )
}

function DailyConnections({ onPlayCustom }) {
  const game = useConnectionsGame('daily')
  return <Play game={game} onPlayCustom={onPlayCustom} />
}

function CustomConnections() {
  const game = useConnectionsGame('custom')
  return game.phase === 'setup' ? <Setup game={game} /> : <Play game={game} />
}

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'custom', label: 'Custom' },
]

// Shown once, the first time someone opens Connections after it became timed
function WhatsNew({ onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal cx-whatsnew" role="dialog" aria-modal="true" aria-labelledby="cx-whatsnew-title" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="cx-whatsnew-title" className="cx-whatsnew-title">Connections has changed!</h2>
        <ul className="cx-whatsnew-list">
          <li><strong>Undo is free.</strong> Go back as often as you like. It no longer adds to your score!</li>
          <li><strong>You're timed.</strong> The clock starts when you pick your first Pokémon and ends when you make the final connection. Aim for the quickest time!</li>
          <li><strong>Your score</strong> is the number of connections in your final route, shown next to the shortest possible route and your time.</li>
        </ul>
        <button className="primary-btn cx-whatsnew-btn" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

export default function ConnectionsMode() {
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    try {
      return !localStorage.getItem(RULES_SEEN_KEY)
    } catch {
      return false
    }
  })

  const closeWhatsNew = useCallback(() => {
    setShowWhatsNew(false)
    try {
      localStorage.setItem(RULES_SEEN_KEY, '1')
    } catch {
      // Storage blocked: it may show again next visit
    }
  }, [])

  const [tab, setTab] = useState(() => {
    // A shared link (?tab=daily) wins over the tab remembered from last time
    const linked = new URLSearchParams(window.location.search).get('tab')
    if (linked === 'daily' || linked === 'custom') return linked
    try {
      return localStorage.getItem(TAB_KEY) === 'custom' ? 'custom' : 'daily'
    } catch {
      return 'daily'
    }
  })

  function chooseTab(next) {
    setTab(next)
    try {
      localStorage.setItem(TAB_KEY, next)
    } catch {
      // Only a convenience: the tab just won't be remembered next visit
    }
  }

  return (
    <div className="cx-root">
      <div className="cx-tabs" role="tablist" aria-label="Puzzle type">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`cx-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => chooseTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily'
        ? <DailyConnections onPlayCustom={() => { chooseTab('custom'); window.scrollTo({ top: 0 }) }} />
        : <CustomConnections />}

      {showWhatsNew && <WhatsNew onClose={closeWhatsNew} />}
    </div>
  )
}
