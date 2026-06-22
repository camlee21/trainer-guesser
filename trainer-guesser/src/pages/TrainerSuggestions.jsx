
import { Link } from 'react-router-dom'

export default function TrainerSuggestions() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">Trainer Suggestions</h2>
      <p className="game-description" style={{ margin: '0 auto' }}>
        If you would like to suggest a trainer for Daily mode for a particular day, hit me up on{' '}
        <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
          Twitter
        </a>{' '}
        with all the info, including trainer data, your display name and a link of your choice. A
        custom trainer suggestion form may be implemented here later, so stay tuned!
      </p>
    </main>
  )
}