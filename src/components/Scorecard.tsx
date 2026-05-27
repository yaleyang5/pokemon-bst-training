import type { PokemonSummary } from '../api/pokemon'
import { buildShareUrl, type Challenge } from '../util/share'
import { EmojiConfetti } from './EmojiConfetti'
import { ShareButton } from './ShareButton'

/** The result of one round within a multi-round game. */
export type RoundOutcome = {
  target: PokemonSummary
  solved: boolean
  /** True if the player gave up rather than running out of guesses. */
  gaveUp: boolean
  guessCount: number
}

type Props = {
  outcomes: RoundOutcome[]
  /** The game expressed as a challenge, so the result + link can be shared. */
  challenge: Challenge | null
  onPlayAgain: () => void
}

export function Scorecard({ outcomes, challenge, onPlayAgain }: Props) {
  const total = outcomes.length
  const solved = outcomes.filter((o) => o.solved).length
  const totalGuesses = outcomes.reduce((sum, o) => sum + o.guessCount, 0)
  const allSolved = solved === total

  const url = challenge ? buildShareUrl(challenge) : null
  // Wordle-style: green/red per round, the score, and the link — no names.
  const squares = outcomes.map((o) => (o.solved ? '🟩' : '🟥')).join('')
  const resultText =
    url &&
    `Pokémon Base Stat Quiz\nSolved ${solved}/${total} rounds · ${totalGuesses} ${totalGuesses === 1 ? 'guess' : 'guesses'}\n${squares}\n${url}`

  return (
    <div className="quiz-result">
      <EmojiConfetti emoji={allSolved ? '🎉' : solved === 0 ? '🥲' : '✨'} />
      <p className={`result-banner ${allSolved ? 'good' : solved === 0 ? 'off' : ''}`}>
        {allSolved ? 'Perfect game! 🎉' : `Solved ${solved} of ${total}`}
      </p>

      <div className="score-summary">
        <div>
          <span className="score-num">
            {solved}/{total}
          </span>
          <span className="score-label">Solved</span>
        </div>
        <div>
          <span className="score-num">{totalGuesses}</span>
          <span className="score-label">Total guesses</span>
        </div>
      </div>

      <ol className="scorecard">
        {outcomes.map((o, i) => (
          <li key={i} className={`scorecard-row ${o.solved ? 'scorecard-row--ok' : 'scorecard-row--no'}`}>
            <span className="scorecard-num">{i + 1}</span>
            <img src={o.target.sprite} alt="" className="scorecard-sprite" loading="lazy" />
            <span className="scorecard-name">{o.target.name}</span>
            <span className="scorecard-result">
              {o.solved
                ? `✓ ${o.guessCount} ${o.guessCount === 1 ? 'guess' : 'guesses'}`
                : o.gaveUp
                  ? '✗ gave up'
                  : '✗ missed'}
            </span>
          </li>
        ))}
      </ol>

      <div className="result-actions">
        <button type="button" className="primary-btn" onClick={onPlayAgain}>
          ↻ Play again
        </button>
        <ShareButton label="Share result" text={resultText || null} />
        <ShareButton label="Share this challenge" text={url} />
      </div>
    </div>
  )
}
