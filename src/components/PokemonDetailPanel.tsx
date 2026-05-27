import type { PokemonSummary } from '../api/pokemon'
import { usePokemonQuery } from '../hooks/usePokemon'
import { AddToListMenu } from './AddToListMenu'
import { StatBars } from './StatBars'

type Props = {
  pokemon: PokemonSummary
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  /** e.g. "12 / 151" — position within the current filtered/sorted list. */
  position: string
}

export function PokemonDetailPanel({
  pokemon,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  position,
}: Props) {
  // Stats render instantly from the summary; meta is fetched on demand. Because
  // this panel stays mounted while you step through Pokémon, the stat bars
  // animate their width between selections.
  const { data: detail, isLoading } = usePokemonQuery(pokemon.id)

  return (
    <div className="detail detail--panel">
      <div className="detail-nav">
        <button type="button" className="link-btn" onClick={onClose}>
          ← Back to lists
        </button>
        <div className="detail-stepper">
          <button type="button" className="icon-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous">
            ‹
          </button>
          <span className="detail-position">{position}</span>
          <button type="button" className="icon-btn" onClick={onNext} disabled={!hasNext} aria-label="Next">
            ›
          </button>
        </div>
      </div>

      <div className="detail-header">
        <img src={pokemon.sprite} alt={pokemon.name} className="detail-sprite" />
        <div>
          <span className="pokemon-id">
            #{String(pokemon.id).padStart(4, '0')} · Gen {pokemon.generation}
          </span>
          <h3>{pokemon.name}</h3>
          <div className="types">
            {pokemon.types.map((t) => (
              <span key={t} className={`type type-${t}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <AddToListMenu pokemonId={pokemon.id} variant="full" />

      <StatBars stats={pokemon.stats} bst={pokemon.bst} />

      <div className="meta">
        <div>
          <span className="meta-label">Height</span>
          <span>{detail ? `${detail.height / 10} m` : isLoading ? '…' : '—'}</span>
        </div>
        <div>
          <span className="meta-label">Weight</span>
          <span>{detail ? `${detail.weight / 10} kg` : isLoading ? '…' : '—'}</span>
        </div>
        <div>
          <span className="meta-label">Abilities</span>
          <span>
            {detail ? detail.abilities.map((a) => a.ability.name).join(', ') : isLoading ? '…' : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
