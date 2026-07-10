import { Link } from 'react-router-dom'

const CREDITS = [
  {
    name: 'PokéAPI',
    url: 'https://pokeapi.co',
    description: 'Pokémon sprites',
    image: "/credits/pokeapi.png",
  },
  {
    name: 'Serebii',
    url: 'https://www.serebii.net',
    description: 'Trainer sprites & team info',
    image: "/credits/serebii.jpg",
  },
  {
    name: 'Bulbapedia',
    url: 'https://bulbapedia.bulbagarden.net/wiki/Main_Page',
    description: 'Trainer sprites & team info',
    image: "/credits/bulbapedia.png",
  },
  {
    name: 'Sparkly',
    url: 'https://shinishiny.carrd.co/',
    description: 'Banner artwork',
    image: "/credits/sparkly.jpg",
  },
  {
    name: 'Pokedoku',
    url: 'https://pokedoku.com',
    description: 'Inspiration',
    image: "https://pokedoku-space.nyc3.cdn.digitaloceanspaces.com/resources/branding/pokedoku_logo.svg",
  },
  {
    name: 'NYT Games',
    url: 'https://www.nytco.com/games/',
    description: 'Inspiration',
    image: "/credits/nytgames.jpg",
  },
]

export default function Credits() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">Credits</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center' }}>
        Thank you to these sources for helping make this possible!
      </p>

      <div className="credits-grid">
        {CREDITS.map(credit => (
          <a
            key={credit.name}
            href={credit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="credit-card"
          >
            <div className="credit-card-image">
              {credit.image
                ? <img src={credit.image} alt={credit.name} />
                : <span className="credit-card-placeholder">?</span>
              }
            </div>
            <div className="credit-card-body">
              <span className="credit-card-name">{credit.name}</span>
              <span className="credit-card-desc">{credit.description}</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}