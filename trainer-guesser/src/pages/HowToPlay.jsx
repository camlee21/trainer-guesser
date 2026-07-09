import { Link } from 'react-router-dom'

export default function HowToPlay() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">How to Play</h2>

      {/* Daily Mode Block */}
      <div className="game-description" style={{ margin: '0 auto', textAlign: 'left' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          Daily Mode
        </h3>

        <p>
          In <strong>Daily mode</strong>, a new Pokémon trainer is chosen each day for you to try and identify. You have <strong>5 guesses</strong> to
          figure out who they are, with new clues revealed after each wrong guess (or pass):
        </p>

        <ul style={{ margin: '1rem 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li style={{ display: 'flex', gap: '0.5rem' }}><strong style={{ whiteSpace: 'nowrap' }}>Clue 1 -</strong><span>The trainer's Pokémon team is revealed.</span></li>
          <li style={{ display: 'flex', gap: '0.5rem' }}><strong style={{ whiteSpace: 'nowrap' }}>Clue 2 -</strong><span>The game they originate from is revealed.</span></li>
          <li style={{ display: 'flex', gap: '0.5rem' }}><strong style={{ whiteSpace: 'nowrap' }}>Clue 3 -</strong><span>Their trainer type is shown (e.g. Gym Leader, Elite Four, Rival) and a trainer silhouette is revealed.</span></li>
          <li style={{ display: 'flex', gap: '0.5rem' }}><strong style={{ whiteSpace: 'nowrap' }}>Clue 4 -</strong><span>The trainer's sprite is fully revealed.</span></li>
        </ul>

        <p>
          Type a trainer's name in the search box and select them to make a guess. If you're stuck,
          hit <strong>Pass</strong> to skip your current guess and unlock the next clue! Fun tip: if
          you know the game the trainer is from, typing the name of the game into the search bar will
          show all of the trainers from that game!
        </p>

        <p style={{ marginTop: '1rem' }}>
          A new trainer resets every day at <strong>midnight GMT</strong>. Trainers are rated <strong>Easy</strong>,{' '}
          <strong>Medium</strong>, or <strong>Hard</strong> based on how obscure they are, so some days
          will really test your knowledge!
        </p>
      </div>

      {/* Infinite Mode Block */}
      <div className="game-description" style={{ margin: '1rem auto 0', textAlign: 'left' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          Infinite Mode
        </h3>

        <p>
          <strong>Infinite mode</strong> lets you quiz yourself endlessly on all of the trainers in our database! You can filter the trainers by their <strong>difficulty</strong> and
          the games by their <strong>generation</strong>, or you can select the <strong>specific games</strong> you'd like to be quizzed on. You will then be given trainers randomly from your filter pool, so there may be some repeats.
          Just for fun, your <strong>score</strong> (which is your concurrent tally of how many guesses you've required, one point off per incorrect guess) and a <strong>timer</strong> will
          be displayed. Make up your own challenges, or try to get as many points as you can within a time duration of your choice!
        </p>

        <p style={{ marginTop: '1rem' }}>
          Unique to Infinite mode are the additions of trainers from <strong>rom hacks</strong> and <strong>B2W2 Challenge mode</strong>! These are excluded from Daily mode since I assume that the majority of casual players would not know them, but
          Pokemon experts and fans of difficulty rom hacks such as Run & Bun, the Kaizo games and Radical Red will be able to test their knowledge in this mode! You can suggest new rom hacks or different modes to be added by
          DMing me on Twitter or using the Trainer Suggestions page!
        </p>
      </div>

      {/* General Notes Block */}
      <div className="game-description" style={{ margin: '1rem auto 0', textAlign: 'left' }}>
        <p>
          I am always looking to improve this website and my web development skills, so feel free to DM me your feedback to my Twitter, linked above. <strong>Have fun!</strong> - Draglash
        </p>
      </div>
    </main>
  )
}