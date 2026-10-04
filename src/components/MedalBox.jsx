import { useEffect, useState } from 'react'
import { useMedals } from '../contexts/MedalsContext'
import { medalStage, STAGE_STARTS, TOTAL_MEDALS } from '../lib/medals'

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'incomplete', label: 'Incomplete', test: m => !m.earned },
  { id: 'daily', label: 'Daily', test: m => m.mode === 'daily' },
  { id: 'infinite', label: 'Infinite', test: m => m.mode === 'infinite' },
  { id: 'connections', label: 'Connections', test: m => m.mode === 'connections' },
  { id: 'completed', label: 'Completed', test: m => m.earned },
]

export default function MedalBox({ onClose }) {
  const { medals, earnedCount, refresh } = useMedals()
  const [filter, setFilter] = useState('all')

  // Pick up any games finished since the page loaded
  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stage = medalStage(earnedCount)
  const nextStart = STAGE_STARTS[stage] // undefined once every medal is earned
  const shown = medals.filter(FILTERS.find(f => f.id === filter).test)

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="medal-box" role="dialog" aria-modal="true" aria-labelledby="medal-box-title" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 id="medal-box-title" className="medal-box-title">Medals</h2>

        <div className="medal-box-progress">
          <img className="medal-img" src={`/medal_imgs/medal-${stage}.png`} alt={`Stage ${stage} medal`} />
          {nextStart ? (
            <>
              <span><strong>{earnedCount}</strong> / {nextStart} medals</span>
              <span className="medal-box-arrow" aria-hidden="true">→</span>
              <img className="medal-img" src={`/medal_imgs/medal-${stage + 1}.png`} alt={`Next: stage ${stage + 1} medal`} />
            </>
          ) : (
            <span>All <strong>{TOTAL_MEDALS}</strong> medals collected!</span>
          )}
        </div>

        <div className="medal-box-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`filter-ctrl-btn ${filter === f.id ? 'accent' : ''}`}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ul className="medal-list">
          {shown.map(m => (
            <li key={m.id} className={`medal-row ${m.earned ? 'earned' : ''}`}>
              <img className="medal-img" src={m.earned ? '/medal_imgs/medal-1.png' : '/medal_imgs/hint-medal.png'} alt="" />
              <div className="medal-row-text">
                <div className="medal-row-name">{m.name}</div>
                <div className="medal-row-desc">{m.description}</div>
                {m.target > 1 && (
                  <div className="medal-row-bar" role="progressbar" aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={m.progress}>
                    <div style={{ width: `${(m.progress / m.target) * 100}%` }} />
                  </div>
                )}
              </div>
              <div className="medal-row-count">
                {m.earned ? '✓' : `${m.progress}/${m.target}`}
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="medal-list-empty">No medals here yet.</li>}
        </ul>
      </div>
    </div>
  )
}
