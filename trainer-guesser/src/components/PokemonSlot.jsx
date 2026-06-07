import { getPokemonSpriteUrl } from '../utils/sprites'

export default function PokemonSlot({ pokemon, revealed }) {
  if (!pokemon) {
    return <div className="w-24 h-24 bg-gray-800 rounded-lg opacity-30" />
  }

  return (
    <div className="flex flex-col items-center bg-gray-800 rounded-lg p-2">
      <img
        src={getPokemonSpriteUrl(pokemon.pokedexId)}
        alt={revealed ? pokemon.name : '???'}
        className="w-20 h-20 object-contain"
        style={{ filter: revealed ? 'none' : 'brightness(0)' }}
      />
      <span className="text-sm mt-1">
        {revealed ? pokemon.name : '???'}
      </span>
    </div>
  )
}