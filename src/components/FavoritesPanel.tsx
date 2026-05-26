import { useFavoritesQuery } from '../hooks/useFavorites'
import { FavoriteRow } from './FavoriteRow'

type Props = {
  onSelect: (id: number) => void
}

export function FavoritesPanel({ onSelect }: Props) {
  const {
    data: favorites,
    isLoading: isLoadingFavorites,
    isFetching: isFetchingFavorites,
  } = useFavoritesQuery()

  const ids = favorites ?? []

  if (isLoadingFavorites) return <p className="muted">Loading favorites…</p>

  return (
    <div className="favorites">
      <p className="muted small">
        {ids.length === 0
          ? 'Star any Pokémon (from a card or its detail view) to build your list.'
          : `${ids.length} favorited`}
        {isFetchingFavorites && ' · syncing'}
      </p>

      {ids.length > 0 && (
        <ul className="fav-list">
          {ids.map((id) => (
            <FavoriteRow key={id} id={id} onSelect={onSelect} />
          ))}
        </ul>
      )}

      {/* <div className="hint">
        <strong>Try this:</strong>
        <ol>
          <li>Hover a card — detail prefetches (watch Devtools).</li>
          <li>Click it — instant render from cache.</li>
          <li>Star it from a card or detail — UI updates immediately (optimistic) while the 1.5s mutation runs.</li>
          <li>Refresh — favorites persist; each row fetches its own detail (shared cache with the detail view).</li>
        </ol>
      </div> */}
    </div>
  )
}
