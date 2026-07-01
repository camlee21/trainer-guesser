import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-links">
        <Link to="/how-to-play" className="site-footer-link">How to Play</Link>
        <span className="site-footer-divider">•</span>
        <Link to="/stats" className="site-footer-link">Your Stats</Link>
        <span className="site-footer-divider">•</span>
        <Link to="/credits" className="site-footer-link">Credits</Link>
        <span className="site-footer-divider">•</span>
        <Link to="/trainer-suggestions" className="site-footer-link">Trainer Suggestions</Link>
      </div>
    </footer>
  )
}