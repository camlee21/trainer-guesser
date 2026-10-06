import { getPokemonSpriteUrl } from '../utils/sprites'

export default function PokemonSlot({ pokemon, revealed }) {
  if (!pokemon) {
    return <div className="pokemon-slot empty" />
  }

  // The name underneath does the talking, so the sprite itself is decorative
  return (
    <div className="pokemon-slot">
      <img
        src={getPokemonSpriteUrl(pokemon.pokedexId)}
        alt=""
        className="pokemon-sprite"
        style={{ filter: revealed ? 'none' : 'brightness(0)' }}
      />
      <span className="pokemon-name">
        {revealed ? pokemon.name : (
          <>
            <span aria-hidden="true">???</span>
            <span className="sr-only">Unknown Pokémon</span>
          </>
        )}
      </span>
    </div>
  )
}
