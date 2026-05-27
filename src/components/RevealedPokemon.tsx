import type { PokemonSummary } from '../api/pokemon'
import { usePokemonQuery } from '../hooks/usePokemon'
import { CryButton } from './CryButton'
import { StatBars } from './StatBars'

type Props = {
  target: PokemonSummary
}

/** The fully-revealed answer card (sprite, name, types, stats, cry, meta) shown
 *  once a round is over. Shared by the single-round result, the between-round
 *  reveal, and the multi-round scorecard. */
export function RevealedPokemon({ target }: Props) {
  const { data: detail } = usePokemonQuery(target.id)

  return (
    <div className="quiz-card">
      <div className="quiz-sprite-box">
        <img src={target.sprite} alt={target.name} className="quiz-img" />
      </div>
      <span className="pokemon-id">
        #{String(target.id).padStart(4, '0')} · Gen {target.generation}
      </span>
      <h3 className="quiz-name">{target.name}</h3>
      <div className="types">
        {target.types.map((t) => (
          <span key={t} className={`type type-${t}`}>
            {t}
          </span>
        ))}
      </div>
      <StatBars stats={target.stats} bst={target.bst} highlight="bst" />
      <CryButton src={detail?.cries?.latest ?? null} />
      {detail && (
        <div className="meta">
          <div>
            <span className="meta-label">Height</span>
            <span>{detail.height / 10} m</span>
          </div>
          <div>
            <span className="meta-label">Weight</span>
            <span>{detail.weight / 10} kg</span>
          </div>
          <div>
            <span className="meta-label">Abilities</span>
            <span>{detail.abilities.map((a) => a.ability.name).join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
