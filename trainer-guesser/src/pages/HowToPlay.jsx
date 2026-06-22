
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
          In our <strong>Daily mode</strong>, a new Pokémon trainer is chosen each day for you to try and identify. You have <strong>5 guesses</strong> to
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

        <p style={{ marginTop: '1rem' }}>
          <strong>Infinite mode</strong> lets you quiz yourself endlessly on all of the trainers in our database! You can filter the games by <strong>generation</strong>, or
          select the <strong>specific games</strong> you'd like to be quizzed on. You will then be given trainers randomly from your filter pool, so there may be some repeats.
          Just for fun, your <strong>score</strong> (which is your concurrent tally of how many guesses you've required, one point off per incorrect guess) and a <strong>timer</strong> will 
          be displayed. Make up your own challenges, or try to get as many points as you can within a time duration of your choice!
        </p>

        <p style={{ marginTop: '1rem' }}>
          Also, this website was designed with a <strong>desktop</strong> in mind, so apologies if the UI isn't ideal for smartphones or tablets.
          In the future I can focus more on the mobile layout if it is requested enough!
        </p>

        <p style={{ marginTop: '1rem' }}>
          I am always looking to improve this website and my web development skills, so feel free to DM me your feedback to my Twitter, linked above. <strong>Have fun!</strong>
        </p>
      </div>
    </main>
  )
}