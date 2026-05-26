import { useQueryClient } from '@tanstack/react-query'
import { usePokemonListQuery } from '../hooks/usePokemon'
import { fetchPokemon } from '../api/pokemon'
import { useFavoritesQuery, useToggleFavoriteMutation } from '../hooks/useFavorites'
import { QUERY_KEYS } from '../constants/queryKeys'

type Props = {
  selectedId: number | null
  onSelect: (id: number) => void
}

const SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

export function PokemonList({ selectedId, onSelect }: Props) {
  const queryClient = useQueryClient()
  const {
    data: pokemonList,
    isLoading: isLoadingPokemonList,
    isError: isErrorPokemonList,
    error: errorPokemonList,
  } = usePokemonListQuery(151, 0)
  const { data: favorites = [] } = useFavoritesQuery()
  const { mutate: toggleFavorite } = useToggleFavoriteMutation()

  const prefetch = (idOrName: string | number) => {
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.POKEMON, 'detail', idOrName],
      queryFn: () => fetchPokemon(idOrName),
    })
  }

  if (isLoadingPokemonList) return <p className="muted">Loading Pokémon…</p>
  if (isErrorPokemonList) return <p className="error">Error: {(errorPokemonList as Error).message}</p>
  if (!pokemonList) return null

  return (
    <ul className="pokemon-grid">
      {pokemonList.results.map((p) => {
        const isFav = favorites.includes(p.id)
        const isSelected = selectedId === p.id
        return (
          <li key={p.id} className={`pokemon-card ${isSelected ? 'selected' : ''}`}>
            <button
              type="button"
              className="pokemon-card-main"
              onClick={() => onSelect(p.id)}
              onMouseEnter={() => prefetch(p.id)}
              onFocus={() => prefetch(p.id)}
            >
              <img src={SPRITE(p.id)} alt={p.name} loading="lazy" />
              <span className="pokemon-id">#{String(p.id).padStart(3, '0')}</span>
              <span className="pokemon-name">{p.name}</span>
            </button>
            <button
              type="button"
              className={`fav-star ${isFav ? 'is-fav' : ''}`}
              onClick={() => toggleFavorite(p.id)}
              aria-label={isFav ? `Unfavorite ${p.name}` : `Favorite ${p.name}`}
              aria-pressed={isFav}
            >
              {isFav ? '★' : '☆'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
