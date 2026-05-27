import { useMemo, useState } from 'react'
import { useGenerationSummaries } from '../hooks/usePokemon'
import {
  SORT_OPTIONS,
  defaultFilters,
  isFilterActive,
  matchesFilters,
  searchMatch,
  sortPokemon,
  type PokemonFilters,
  type SortKey,
} from '../util/filters'
import { BulkAddToListMenu } from './BulkAddToListMenu'
import { FilterControls } from './FilterControls'
import { GenerationSelector } from './GenerationSelector'
import { ListsPanel } from './ListsPanel'
import { PokemonCard } from './PokemonCard'
import { PokemonDetailPanel } from './PokemonDetailPanel'

export function BrowseMode() {
  const [generations, setGenerations] = useState<number[]>([1])
  const [filters, setFilters] = useState<PokemonFilters>(defaultFilters)
  const [query, setQuery] = useState('')
  const [startsWith, setStartsWith] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [multiSelect, setMultiSelect] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const { pokemon, isLoading, isError, progress } = useGenerationSummaries(generations)

  const lookup = useMemo(() => new Map(pokemon.map((p) => [p.id, p])), [pokemon])

  const visible = useMemo(() => {
    const filtered = pokemon.filter(
      (p) => matchesFilters(p, filters) && searchMatch(p.name, query, startsWith),
    )
    return sortPokemon(filtered, { key: sortKey, dir: sortDir })
  }, [pokemon, filters, query, startsWith, sortKey, sortDir])

  const selected = selectedId !== null ? lookup.get(selectedId) ?? null : null
  const filtersActive = isFilterActive(filters)

  // Position of the selection within the visible list, for prev/next stepping.
  const selectedIndex = selected ? visible.findIndex((p) => p.id === selected.id) : -1
  const stepTo = (delta: number) => {
    if (selectedIndex < 0) return
    const next = visible[selectedIndex + delta]
    if (next) setSelectedId(next.id)
  }

  // Clicking a card opens its detail, or toggles its checkbox in multi-select.
  const onCardClick = (id: number) => {
    if (!multiSelect) {
      setSelectedId(id)
      return
    }
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleMultiSelect = () => {
    setMultiSelect((on) => {
      if (on) setPicked(new Set())
      else setSelectedId(null)
      return !on
    })
  }

  return (
    <div className="browse">
      <div className="browse-main">
        <GenerationSelector selected={generations} onChange={setGenerations} />

        <div className="toolbar">
          <div className="search-box">
          <label className="check">
              <input
                type="checkbox"
                checked={startsWith}
                onChange={(e) => setStartsWith(e.target.checked)}
              />
              starts with
            </label>
            <input
              type="search"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="sort-box">
            <label>
              Sort
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="dir-btn"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? 'Asc ↑' : 'Desc ↓'}
            </button>
          </div>

          <button
            type="button"
            className={`filters-toggle ${showFilters ? 'filters-toggle--active' : ''}`}
            onClick={() => setShowFilters((s) => !s)}
          >
            {showFilters ? 'Hide filters' : 'Filters'}
            {filtersActive && <span className="dot" aria-label="filters active" />}
          </button>

          <button
            type="button"
            className={`filters-toggle ${multiSelect ? 'filters-toggle--active' : ''}`}
            onClick={toggleMultiSelect}
          >
            {multiSelect ? 'Done' : 'Multi-select'}
          </button>
        </div>

        {showFilters && <FilterControls filters={filters} onChange={setFilters} />}

        {multiSelect ? (
          <div className="select-bar">
            <span className="muted">{picked.size} selected</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => setPicked(new Set(visible.map((p) => p.id)))}
            >
              Select all ({visible.length})
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => setPicked(new Set())}
              disabled={picked.size === 0}
            >
              Clear
            </button>
            <BulkAddToListMenu pokemonIds={[...picked]} />
          </div>
        ) : (
          <div className="results-bar">
            {generations.length === 0 ? (
              <span className="muted">Pick at least one generation above.</span>
            ) : isLoading ? (
              <span className="muted">Loading Pokémon… {Math.round(progress * 100)}%</span>
            ) : isError ? (
              <span className="error">Some Pokémon failed to load — try toggling the generation.</span>
            ) : (
              <span className="muted">
                {visible.length} of {pokemon.length} shown
              </span>
            )}
          </div>
        )}

        {visible.length === 0 && !isLoading && generations.length > 0 ? (
          <p className="empty-state">No Pokémon match these filters. Try adjusting them.</p>
        ) : (
          <ul className="pokemon-grid">
            {visible.map((p) => (
              <PokemonCard
                key={p.id}
                pokemon={p}
                onSelect={onCardClick}
                selected={multiSelect ? picked.has(p.id) : selectedId === p.id}
                selectable={multiSelect}
                sortKey={sortKey}
              />
            ))}
          </ul>
        )}
      </div>

      <aside className="browse-side panel">
        {selected && selectedIndex >= 0 ? (
          <PokemonDetailPanel
            pokemon={selected}
            onClose={() => setSelectedId(null)}
            onPrev={() => stepTo(-1)}
            onNext={() => stepTo(1)}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < visible.length - 1}
            position={`${selectedIndex + 1} / ${visible.length}`}
          />
        ) : (
          <>
            <h2>Your lists</h2>
            <ListsPanel lookup={lookup} onSelect={setSelectedId} />
          </>
        )}
      </aside>
    </div>
  )
}
