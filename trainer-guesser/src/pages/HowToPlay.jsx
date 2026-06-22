
import { Link } from 'react-router-dom'

export default function HowToPlay() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">How to Play</h2>

      <div className="game-description" style={{ margin: '0 auto', textAlign: 'left' }}>
        <p>
          Each day, a new Pokémon trainer is chosen for you to identify. You have <strong>5 guesses</strong> to
          figure out who they are, with new clues revealed after each wrong guess or pass:
        </p>

        <ul style={{ margin: '1rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Clue 1</strong> - The trainer's Pokémon team is revealed</li>
          <li><strong>Clue 2</strong> - The game they originate from is revealed.</li>
          <li><strong>Clue 3</strong> - Their trainer type is shown (e.g. Gym Leader, Elite Four, Rival) and a trainer silhouette is revealed.</li>
          <li><strong>Clue 4</strong> - The trainer's sprite is fully revealed</li>
        </ul>

        <p>
          Type a trainer's name in the search box and select them to make a guess. If you're stuck,
          hit <strong>Pass</strong> to skip your current guess and unlock the next clue!
        </p>

        <p style={{ marginTop: '1rem' }}>
          A new trainer resets every day at <strong>midnight GMT</strong>. Trainers are rated <strong>Easy</strong>,{' '}
          <strong>Medium</strong>, or <strong>Hard</strong> based on how obscure they are, so some days
          will really test your knowledge!
        </p>
      </div>
    </main>
  )
}