import { usePokemonQuery } from '../hooks/usePokemon'
import { useFavoritesQuery, useToggleFavoriteMutation } from '../hooks/useFavorites'

type Props = {
  id: number
  onClose: () => void
}

export function PokemonDetail({ id, onClose }: Props) {
  const {
    data: pokemon,
    isLoading: isLoadingPokemon,
    isError: isErrorPokemon,
    error: errorPokemon,
    isFetching: isFetchingPokemon,
  } = usePokemonQuery(id)
  const { data: favorites = [] } = useFavoritesQuery()
  const { mutate: toggleFavorite } = useToggleFavoriteMutation()

  const isFav = favorites.includes(id)

  return (
    <div className="detail">
      <button type="button" className="close-btn" onClick={onClose}>
        ← Back to favorites
      </button>

      {isLoadingPokemon && <p className="muted">Loading…</p>}
      {isErrorPokemon && <p className="error">Error: {(errorPokemon as Error).message}</p>}

      {pokemon && (
        <>
          <div className="detail-header">
            <img
              src={
                pokemon.sprites.other['official-artwork'].front_default ??
                pokemon.sprites.front_default ??
                ''
              }
              alt={pokemon.name}
              className="detail-sprite"
            />
            <div>
              <span className="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</span>
              <h3>{pokemon.name}</h3>
              <div className="types">
                {pokemon.types.map((t) => (
                  <span key={t.type.name} className={`type type-${t.type.name}`}>
                    {t.type.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`fav-btn ${isFav ? 'is-fav' : ''}`}
            onClick={() => toggleFavorite(id)}
          >
            {isFav ? '★ Favorited' : '☆ Add to favorites'}
          </button>
          {isFetchingPokemon && <span className="muted small"> · refreshing</span>}

          <dl className="stats">
            {pokemon.stats.map((s) => (
              <div key={s.stat.name} className="stat-row">
                <dt>{s.stat.name}</dt>
                <dd>
                  <div className="stat-bar" style={{ width: `${Math.min(100, s.base_stat / 2)}%` }} />
                  <span>{s.base_stat}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="meta">
            <div>
              <span className="meta-label">Height</span>
              <span>{pokemon.height / 10} m</span>
            </div>
            <div>
              <span className="meta-label">Weight</span>
              <span>{pokemon.weight / 10} kg</span>
            </div>
            <div>
              <span className="meta-label">Abilities</span>
              <span>{pokemon.abilities.map((a) => a.ability.name).join(', ')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
