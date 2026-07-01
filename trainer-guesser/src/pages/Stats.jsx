import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { computeStreak } from '../lib/streakUtils'

export default function Stats() {
  const { user, loading: authLoading } = useAuthContext()
  const [results, setResults] = useState([])
  const [fetching, setFetching] = useState(true)

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
    <main className="static-page">
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
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Trainer</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>#{r.day_number}</td>
                  <td>{r.trainer_name}</td>
                  <td className={r.won ? 'stats-score-won' : 'stats-score-lost'}>
                    {r.won ? `${r.score}/5` : 'Lost'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}