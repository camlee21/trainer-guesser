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
        <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="site-footer-link site-footer-social">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="site-footer-handle">drag1ash</span>
        </a>
      </nav>
    </footer>
  )
}
