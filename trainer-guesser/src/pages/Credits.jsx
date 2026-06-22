
import { Link } from 'react-router-dom'

export default function Credits() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">Credits</h2>
      <p className="game-description" style={{ margin: '0 auto' }}>
        Credits content coming soon.
      </p>
    </main>
  )
}