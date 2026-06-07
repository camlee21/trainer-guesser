import PokemonSlot from './PokemonSlot'

export default function TeamGrid({ team, revealed }) {
  const slots = [...team, ...Array(6 - team.length).fill(null)]

  return (
    <div className="team-grid">
      {slots.map((pokemon, i) => (
        <PokemonSlot key={i} pokemon={pokemon} revealed={revealed} />
      ))}
    </div>
  )
}