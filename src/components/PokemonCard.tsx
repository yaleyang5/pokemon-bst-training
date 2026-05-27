import type { PokemonSummary } from '../api/pokemon'
import { STAT_LABELS, type StatKey } from '../constants/pokemon'
import type { SortKey } from '../util/filters'
import { AddToListMenu } from './AddToListMenu'

type Props = {
  pokemon: PokemonSummary
  onSelect: (id: number) => void
  selected?: boolean
  /** Multi-select mode: clicking toggles a checkbox instead of opening detail. */
  selectable?: boolean
  /** When sorting by a stat, surface that value on the card. */
  sortKey?: SortKey
}

export function PokemonCard({
  pokemon,
  onSelect,
  selected = false,
  selectable = false,
  sortKey = 'id',
}: Props) {
  const showBST = sortKey === 'bst'
  const showStat = sortKey !== 'id' && sortKey !== 'name' && !showBST
  const statValue = showStat ? pokemon.stats[sortKey as StatKey] : null

  return (
    <li className={`pokemon-card ${selected ? 'selected' : ''}`}>
      <button type="button" className="pokemon-card-main" onClick={() => onSelect(pokemon.id)}>
        <span className="card-dexno" title="Pokédex number">
          #{String(pokemon.id).padStart(4, '0')}
        </span>
        <img src={pokemon.sprite} alt={pokemon.name} loading="lazy" style={{ userSelect: 'none', pointerEvents: 'none' }}/>
        <span className="pokemon-name">{pokemon.name}</span>
        <span className="card-types">
          {pokemon.types.map((t) => (
            <span key={t} className={`type type-${t} type--mini`}>
              {t}
            </span>
          ))}
        </span>
        {showBST && (
          <span className="card-statline">
            BST: <strong>{pokemon.bst}</strong>
          </span>
        )}
        {showStat && (
          <span className="card-statline">
            {STAT_LABELS[sortKey as StatKey]}: <strong>{statValue}</strong>
          </span>
        )}
      </button>
      <div className="pokemon-card-actions">
        {selectable ? (
          <span className={`card-check ${selected ? 'card-check--on' : ''}`} aria-hidden>
            {selected ? '✓' : ''}
          </span>
        ) : (
          <AddToListMenu pokemonId={pokemon.id} variant="compact" />
        )}
      </div>
    </li>
  )
}
