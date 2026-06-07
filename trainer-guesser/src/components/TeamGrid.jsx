import PokemonSlot from './PokemonSlot'

export default function TeamGrid({ team, revealed }) {
  // Always render 6 slots, fill empties for trainers with < 6 pokemon
  const slots = [...team, ...Array(6 - team.length).fill(null)]

  return (
    <div className="grid grid-cols-3 gap-4">
      {slots.map((pokemon, i) => (
        <PokemonSlot key={i} pokemon={pokemon} revealed={revealed} />
      ))}
    </div>
  )
}