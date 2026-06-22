
import { Link } from 'react-router-dom'

export default function TrainerSuggestions() {
  return (
    <main className="static-page">
        <Link to="/" className="back-btn static-page-back">
            ← Back to Home
        </Link>
      <h2 className="static-page-title">Trainer Suggestions</h2>
      <p className="game-description" style={{ margin: '0 auto' }}>
        Trainer suggestion form coming soon.
      </p>
    </main>
  )
}