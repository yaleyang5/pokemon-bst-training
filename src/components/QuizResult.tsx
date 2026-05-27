import { useState } from 'react'
import type { PokemonSummary } from '../api/pokemon'
import { GENERATIONS } from '../constants/pokemon'
import { usePokemonQuery } from '../hooks/usePokemon'
import { describeFilters, type PokemonFilters } from '../util/filters'
import { describeSettings, type QuizSettings } from '../util/quiz'
import { buildShareUrl, type Challenge } from '../util/share'
import { CryButton } from './CryButton'
import { EmojiConfetti } from './EmojiConfetti'
import { StatBars } from './StatBars'

type Guess = { id: number; name: string; correct: boolean }

type Props = {
  won: boolean
  /** True when the round ended because the player gave up (vs. running out of guesses). */
  gaveUp?: boolean
  target: PokemonSummary
  guesses: Guess[]
  settings: QuizSettings
  filters: PokemonFilters
  generations: number[]
  finalOnly: boolean
  /** Set when the pool was a saved list; embedded in the share link. */
  listIds?: number[]
  guessFromAll: boolean
  onPlayAgain: () => void
}

export function QuizResult({
  won,
  gaveUp = false,
  target,
  guesses,
  settings,
  filters,
  generations,
  finalOnly,
  listIds,
  guessFromAll,
  onPlayAgain,
}: Props) {
  const { data: detail } = usePokemonQuery(target.id)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const challenge: Challenge = {
      v: 1,
      pokemonId: target.id,
      generations,
      filters,
      finalOnly,
      settings,
      guessFromAll,
      ...(listIds ? { listIds } : {}),
    }
    try {
      await navigator.clipboard.writeText(buildShareUrl(challenge))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const poolChips = [
    ...(listIds
      ? [`From a saved list (${listIds.length})`]
      : [
          ...(generations.length === GENERATIONS.length
            ? ['All generations']
            : [...generations].sort((a, b) => a - b).map((g) => `Gen ${g}`)),
          ...(finalOnly ? ['Final evolutions only'] : []),
        ]),
    ...(guessFromAll ? ['Guess from all Pokémon'] : []),
  ]

  return (
    <div className="quiz-result">
      <EmojiConfetti emoji={won ? '🎉' : '🥲'} />
      <p className={`result-banner ${won ? 'good' : 'off'}`}>
        {won
          ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}! 🎉`
          : gaveUp
            ? 'You gave up – it was...'
            : 'Out of attempts – it was...'}
      </p>

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

      {guesses.length > 0 && (
        <ol className="guess-log">
          {guesses.map((g, i) => (
            <li key={i} className={g.correct ? 'guess--correct' : 'guess--wrong'}>
              <span className="guess-num">{i + 1}</span>
              <span className="guess-name">{g.name}</span>
              <span>{g.correct ? '✓' : '✗'}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="result-summary">
        <h4>This challenge</h4>
        <div className="chips">
          {poolChips.map((c) => (
            <span key={c} className="summary-chip">
              {c}
            </span>
          ))}
          {describeFilters(filters).map((c) => (
            <span key={c} className="summary-chip">
              {c}
            </span>
          ))}
          {describeSettings(settings).map((c) => (
            <span key={c} className="summary-chip summary-chip--setting">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="result-actions">
        <button type="button" className="primary-btn" onClick={onPlayAgain}>
          ↻ Play again
        </button>
        <button type="button" className="reset-btn" onClick={share}>
          {copied ? 'Link copied!' : 'Share this challenge'}
        </button>
      </div>
    </div>
  )
}
