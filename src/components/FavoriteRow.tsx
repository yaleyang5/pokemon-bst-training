import { usePokemonQuery } from '../hooks/usePokemon'
import { useToggleFavoriteMutation } from '../hooks/useFavorites'

type Props = {
  id: number
  onSelect: (id: number) => void
}

const SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

export function FavoriteRow({ id, onSelect }: Props) {
  const { data: pokemon, isLoading: isLoadingPokemon } = usePokemonQuery(id)
  const { mutate: toggleFavorite } = useToggleFavoriteMutation()

  const name = pokemon?.name

  return (
    <li className="fav-row">
      <button
        type="button"
        className="fav-row-main"
        onClick={() => onSelect(id)}
      >
        <img src={SPRITE(id)} alt={name ?? `#${id}`} />
        <span>
          <span className="pokemon-id">#{String(id).padStart(3, '0')}</span>{' '}
          {name ?? (isLoadingPokemon ? '…' : '?')}
        </span>
      </button>
      <button
        type="button"
        className="fav-remove"
        onClick={() => toggleFavorite(id)}
        aria-label="Remove from favorites"
      >
        ✕
      </button>
    </li>
  )
}
