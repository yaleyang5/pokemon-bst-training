import type { PokemonSummary } from '../api/pokemon'
import { GENERATIONS } from '../constants/pokemon'
import { describeFilters, type PokemonFilters } from '../util/filters'
import { MAX_ATTEMPTS, describeSettings, type QuizSettings } from '../util/quiz'
import { buildShareUrl, type Challenge } from '../util/share'
import { EmojiConfetti } from './EmojiConfetti'
import { RevealedPokemon } from './RevealedPokemon'
import { ShareButton } from './ShareButton'

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
  const challenge: Challenge = {
    v: 1,
    pokemonIds: [target.id],
    generations,
    filters,
    finalOnly,
    settings,
    guessFromAll,
    ...(listIds ? { listIds } : {}),
  }
  const url = buildShareUrl(challenge)

  // Wordle-style: one square per guess (red = wrong, green = the solve), the
  // outcome, and the link — without naming the Pokémon.
  const squares =
    guesses.map((g) => (g.correct ? '🟩' : '🟥')).join('') +
    '⬜'.repeat(Math.max(0, MAX_ATTEMPTS - guesses.length))
  const headline = won
    ? `Solved using ${guesses.length}/${MAX_ATTEMPTS} guesses`
    : gaveUp
      ? 'Gave up 🏳️'
      : 'Ran out of attempts'
  const resultText = `Pokémon Base Stat Quiz\n${headline}:\n${squares ?? ''}\n${url}`

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
            : 'You ran out of attempts – it was...'}
      </p>

      <RevealedPokemon target={target} />

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
        <ShareButton label="Share result" text={resultText} />
        <ShareButton label="Share this challenge" text={url} />
      </div>
    </div>
  )
}
