import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-links">
        <Link to="/how-to-play" className="site-footer-link">How to Play</Link>
        <Link to="/stats" className="site-footer-link">Your Stats</Link>
        <Link to="/trainer-suggestions" className="site-footer-link">Trainer Suggestions</Link>
        <Link to="/privacy" className="site-footer-link">Privacy Policy</Link>
        <Link to="/credits" className="site-footer-link">Credits</Link>
      </nav>
    </footer>
  )
}
