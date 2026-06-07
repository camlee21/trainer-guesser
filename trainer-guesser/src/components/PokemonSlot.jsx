import { getPokemonSpriteUrl } from '../utils/sprites'

export default function PokemonSlot({ pokemon, revealed }) {
  if (!pokemon) {
    return <div className="pokemon-slot empty" />
  }

  return (
    <div className="pokemon-slot">
      <img
        src={getPokemonSpriteUrl(pokemon.pokedexId)}
        alt={revealed ? pokemon.name : '???'}
        className="pokemon-sprite"
        style={{ filter: revealed ? 'none' : 'brightness(0)' }}
      />
      <span className="pokemon-name">
        {revealed ? pokemon.name : '???'}
      </span>
    </div>
  )
}