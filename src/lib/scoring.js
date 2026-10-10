export const MAX_GUESSES = 5

// What a pass is recorded as. It counts as a wrong guess.
export const PASS_GUESS = { id: '__pass__', label: 'Passed' }

// Points for a Daily or Infinite round: 5 for a first-guess win, down to 1 on the last guess, 0 for a loss
export function scoreForRound(guesses, gameOver) {
  if (gameOver === 'won') {
    return Math.max(0, MAX_GUESSES - (guesses.length - 1))
  }
  return 0
}
