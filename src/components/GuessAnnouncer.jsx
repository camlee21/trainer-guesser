function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

// What each wrong guess unlocks, matching the reveal order on screen
function clueFor(hints, trainer) {
  if (hints === 1) return 'Clue: the team\'s Pokémon names are revealed.'
  if (hints === 2) return `Clue: the game is ${trainer.game}.`
  if (hints === 3) return `Clue: the trainer is a ${toTitleCase(trainer.type)}, and their silhouette is shown.`
  if (hints === 4) return 'Clue: the trainer\'s sprite is revealed.'
  return ''
}

// Reads out each guess's result for screen readers, which otherwise only see the chips appear
export default function GuessAnnouncer({ guesses, gameOver, trainer, maxGuesses }) {
  let message = ''
  const last = guesses[guesses.length - 1]
  if (gameOver === 'won') {
    message = `Correct! It was ${trainer.name}.`
  } else if (gameOver === 'lost') {
    message = `Out of guesses. It was ${trainer.name}.`
  } else if (last) {
    const left = maxGuesses - guesses.length
    const result = last.id === '__pass__' ? 'You passed.' : `${last.label} is wrong.`
    message = `${result} ${left} guess${left === 1 ? '' : 'es'} left. ${clueFor(guesses.length, trainer)}`
  }
  return <p className="sr-only" aria-live="polite">{message}</p>
}
