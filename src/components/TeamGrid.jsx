import { useState } from 'react'
import PokemonSlot from './PokemonSlot'

export default function TeamGrid({ team, revealed }) {
  const slots = [...team, ...Array(6 - team.length).fill(null)]
  // Tiles flip over one by one when the names are revealed mid-game, not when a finished round is reopened
  const [startedHidden] = useState(!revealed)

  return (
    <div className={`team-grid ${revealed && startedHidden ? 'is-flipping' : ''}`}>
      {slots.map((pokemon, i) => (
        <PokemonSlot key={i} index={i} pokemon={pokemon} revealed={revealed} />
      ))}
    </div>
  )
}
