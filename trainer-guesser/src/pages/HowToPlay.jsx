
import { Link } from 'react-router-dom'

export default function HowToPlay() {
  return (
    <main className="static-page">
        <Link to="/" className="back-btn static-page-back">
            ← Back to Home
        </Link>
      <h2 className="static-page-title">How to Play</h2>
      <p className="game-description" style={{ margin: '0 auto' }}>
        Welcome to Who's That Trainer! Try and guess the main-series trainer by their Pokémon team
        in 5 guesses, with a new trainer every day to try and figure out. Guessing incorrectly will
        reveal more clues to you, such as the revealed Pokémon team, the game of origin, the type
        of trainer, and finally, the trainer's appearance. Trainers range from easy to hard in
        difficulty; some days your game knowledge will really be tested! I am always trying to add
        more trainers and improve the website — if you have any feedback or suggestions please DM
        me on Twitter, linked above. Have a great day, and good luck!
      </p>
    </main>
  )
}