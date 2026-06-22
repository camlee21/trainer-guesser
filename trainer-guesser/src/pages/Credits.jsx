
import { Link } from 'react-router-dom'

export default function Credits() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">Credits</h2>

      <div className="game-description" style={{ margin: '0 auto', textAlign: 'left' }}>
        <p>I would like to give credit to these sources for helping me out! Thank you to:</p>

        <ul style={{ margin: '1rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li>
            <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              PokéAPI
            </a>
            {' '}for Pokémon sprites,
          </li>
          <li>
            <a href="https://www.serebii.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              Serebii
            </a>
            {' '}and{' '}
            <a href="https://bulbapedia.bulbagarden.net/wiki/Main_Page" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              Bulbapedia
            </a>
            {' '}for trainer sprites and team information,
          </li>
          <li>
            <a href="https://pokedoku.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              Pokedoku
            </a>
            {' '}and{' '}
            <a href="https://www.nytco.com/games/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              NYT Games
            </a>
            {' '}for inspiring me to create this website!
          </li>
        </ul>
      </div>
    </main>
  )
}