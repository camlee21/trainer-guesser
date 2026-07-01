import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { computeStreak } from '../lib/streakUtils'
import trainersData from '../data/trainers.json'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [yyyy, mm, dd] = dateStr.split('-')
  return `${dd}/${mm}/${yyyy.slice(2)}`
}

export default function Stats() {
  const { user, loading: authLoading } = useAuthContext()
  const [results, setResults] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState('trainer')

  useEffect(() => {
    if (!user) { setFetching(false); return }
    async function fetchResults() {
      const { data } = await supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      setResults(data || [])
      setFetching(false)
    }
    fetchResults()
  }, [user?.id])

  const streak = computeStreak(results)

  const enriched = results.map(r => {
    const trainer = trainersData.trainers.find(t => t.id === r.trainer_id)
    return {
      ...r,
      trainer_sprite_url: trainer?.trainerSpriteUrl ?? null,
      game: trainer?.game ?? null,
      trainer_name: trainer?.name ?? r.trainer_name ?? r.trainer_id,
    }
  })

  const filtered = enriched.filter(r => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    if (searchField === 'trainer') return r.trainer_name?.toLowerCase().includes(q)
    if (searchField === 'day') return String(r.day_number) === q
    if (searchField === 'game') return r.game?.toLowerCase().includes(q)
    if (searchField === 'date') {
      // allow searching as dd/mm/yy, dd/mm, or mm/yy
      return formatDate(r.date).includes(q)
    }
    return true
  })

  if (authLoading || fetching) {
    return (
      <main className="static-page">
        <Link to="/" className="back-btn static-page-back">← Back to Home</Link>
        <h2 className="static-page-title">Your Stats</h2>
        <p className="game-description" style={{ margin: '0 auto' }}>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="static-page">
        <Link to="/" className="back-btn static-page-back">← Back to Home</Link>
        <h2 className="static-page-title">Your Stats</h2>
        <p className="game-description" style={{ margin: '0 auto' }}>
          Please log in to save and view your stats!
        </p>
      </main>
    )
  }

  return (
    <main className="static-page" style={{ width: '100%', maxWidth: '860px' }}>
      <Link to="/" className="back-btn static-page-back">← Back to Home</Link>
      <h2 className="static-page-title">Your Stats</h2>

      {streak >= 2 && (
        <div className="streak-banner">🔥 {streak} day streak</div>
      )}

      {results.length === 0 ? (
        <p className="game-description" style={{ margin: '0 auto' }}>
          No games recorded yet!
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--panel-border)', flexShrink: 0 }}>
              {['trainer', 'day', 'game', 'date'].map(field => (
                <button
                  key={field}
                  onClick={() => { setSearchField(field); setSearch('') }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    border: 'none',
                    cursor: 'pointer',
                    background: searchField === field ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                    color: searchField === field ? 'var(--accent-text)' : 'var(--text-dim)',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </button>
              ))}
            </div>
            <input
              className="search-input"
              style={{ flex: 1, minWidth: '160px' }}
              placeholder={
                searchField === 'day' ? 'e.g. 5' :
                searchField === 'game' ? 'e.g. Platinum, Black/White' :
                searchField === 'date' ? 'e.g. 01/07/25 or 07/25' :
                'e.g. Cynthia'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day #</th>
                  <th>Trainer</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.date}>
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatDate(r.date)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}>
                        {r.day_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {r.trainer_sprite_url && (
                          <img
                            src={r.trainer_sprite_url}
                            alt={r.trainer_name}
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'contain',
                              imageRendering: 'pixelated',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text)' }}>{r.trainer_name}</span>
                          {r.game && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>{r.game}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={r.won ? 'stats-score-won' : 'stats-score-lost'}>
                      {r.won ? `${r.score}/5` : 'Lost'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1.5rem' }}>
                      No results match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}