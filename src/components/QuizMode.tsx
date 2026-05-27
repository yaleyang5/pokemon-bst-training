import { useMemo, useState } from 'react'
import type { NameOption, PokemonSummary } from '../api/pokemon'
import { useFinalEvolutions } from '../hooks/useFinalEvolutions'
import {
  useAllNames,
  useGenerationSummaries,
  useListSummaries,
  usePokemonQuery,
} from '../hooks/usePokemon'
import { useLists } from '../hooks/useLists'
import { defaultFilters, matchesFilters, type PokemonFilters } from '../util/filters'
import {
  MAX_ATTEMPTS,
  defaultQuizSettings,
  effectiveReveal,
  normalizeSettings,
  type QuizSettings as Settings,
} from '../util/quiz'
import {
  challengeTargetIds,
  clearChallengeFromUrl,
  readChallengeFromUrl,
  type Challenge,
} from '../util/share'
import { CryButton } from './CryButton'
import { FilterControls } from './FilterControls'
import { NameComboBox } from './NameComboBox'
import { QuizPool, type PoolSource } from './QuizPool'
import { QuizResult } from './QuizResult'
import { QuizSettings } from './QuizSettings'
import { RevealedPokemon } from './RevealedPokemon'
import { Scorecard, type RoundOutcome } from './Scorecard'
import { StatBars } from './StatBars'

type Status = 'idle' | 'playing' | 'reveal' | 'done'
type Guess = { id: number; name: string; correct: boolean }

/** A frozen snapshot of the setup for the game in progress. Changing the live
 *  controls never affects this — the player must restart to apply changes. */
type Game = {
  targets: PokemonSummary[] // the N Pokémon to guess this game, in order
  options: NameOption[] // frozen guess dropdown (the pool, or all Pokémon)
  settings: Settings // the *configured* reveal settings (what gets shared)
  guessFromAll: boolean
  filters: PokemonFilters
  generations: number[]
  finalOnly: boolean
  listIds?: number[]
  rounds: number // targets.length, kept explicit for readability
  key: string // config signature, to detect when the live setup has diverged
}

/** Fisher–Yates sample of up to `n` distinct items. */
function pickDistinct(items: PokemonSummary[], n: number): PokemonSummary[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}

export function QuizMode() {
  // A shared challenge (from a link) seeds all of setup so the recipient gets
  // the exact same Pokémon, filters, and reveal settings.
  const [challenge] = useState(() => readChallengeFromUrl())
  const [generations, setGenerations] = useState<number[]>(() => challenge?.generations ?? [1])
  const [filters, setFilters] = useState<PokemonFilters>(() => challenge?.filters ?? defaultFilters())
  const [finalOnly, setFinalOnly] = useState(() => challenge?.finalOnly ?? true)
  const [settings, setSettings] = useState<Settings>(() =>
    challenge ? normalizeSettings(challenge.settings) : defaultQuizSettings(),
  )
  const [guessFromAll, setGuessFromAll] = useState(() => challenge?.guessFromAll ?? false)
  const [source, setSource] = useState<PoolSource>(() =>
    challenge?.listIds ? { kind: 'shared', ids: challenge.listIds } : { kind: 'gens' },
  )
  const [rounds, setRounds] = useState(() => (challenge ? challengeTargetIds(challenge).length : 1))
  const [pendingTargetIds, setPendingTargetIds] = useState<number[] | null>(() =>
    challenge ? challengeTargetIds(challenge) : null,
  )

  const [game, setGame] = useState<Game | null>(null)
  const [roundIndex, setRoundIndex] = useState(0)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([])
  const [status, setStatus] = useState<Status>('idle')

  const isGens = source.kind === 'gens'
  const lists = useLists()
  const listIds = useMemo(() => {
    if (source.kind === 'list') return lists.find((l) => l.id === source.id)?.pokemonIds ?? []
    if (source.kind === 'shared') return source.ids
    return []
  }, [source, lists])

  const genSummaries = useGenerationSummaries(isGens ? generations : [])
  const listSummaries = useListSummaries(listIds)
  const { finalIds, isLoading: finalLoading } = useFinalEvolutions(finalOnly && isGens)
  const { names: allNames, isLoading: namesLoading } = useAllNames(guessFromAll)

  const target = game ? game.targets[roundIndex] ?? null : null
  const targetDetail = usePokemonQuery(target?.id ?? null)

  const pokemon = isGens ? genSummaries.pokemon : listSummaries.pokemon
  const sourceLoading = isGens ? genSummaries.isLoading : listSummaries.isLoading
  const sourceInputCount = isGens ? generations.length : listIds.length
  const poolLoading = sourceLoading || finalLoading
  const poolReady = sourceInputCount > 0 && !poolLoading

  const pool = useMemo(
    () =>
      pokemon.filter(
        (p) =>
          matchesFilters(p, filters) && (isGens && finalOnly ? finalIds?.has(p.id) ?? false : true),
      ),
    [pokemon, filters, isGens, finalOnly, finalIds],
  )

  const challengeListIds = isGens ? undefined : listIds

  // Signature of the live setup; if it differs from the game's, offer a restart.
  const liveKey = useMemo(
    () =>
      JSON.stringify({ generations, filters, finalOnly, source, settings, guessFromAll, listIds, rounds }),
    [generations, filters, finalOnly, source, settings, guessFromAll, listIds, rounds],
  )

  // Start a new game. With explicit ids (a shared challenge), those exact
  // Pokémon are used; otherwise N distinct targets are drawn from the pool.
  const beginGame = (explicitIds?: number[]) => {
    const targets =
      explicitIds && explicitIds.length > 0
        ? (explicitIds.map((id) => pokemon.find((p) => p.id === id)).filter(Boolean) as PokemonSummary[])
        : pickDistinct(pool, rounds)
    if (targets.length === 0) {
      setGame(null)
      setStatus('idle')
      return
    }
    setGame({
      targets,
      options: guessFromAll ? allNames : pool,
      settings,
      guessFromAll,
      filters,
      generations,
      finalOnly,
      listIds: challengeListIds,
      rounds: targets.length,
      key: liveKey,
    })
    setRoundIndex(0)
    setGuesses([])
    setOutcomes([])
    setStatus('playing')
  }

  const endRound = (solved: boolean, gaveUp: boolean, finalGuesses: Guess[]) => {
    if (!game || !target) return
    setOutcomes((prev) => [...prev, { target, solved, gaveUp, guessCount: finalGuesses.length }])
    setStatus(game.rounds === 1 ? 'done' : 'reveal')
  }

  const submitGuess = (guess: NameOption) => {
    if (status !== 'playing' || !game || !target) return
    const correct = guess.id === target.id
    const next = [...guesses, { id: guess.id, name: guess.name, correct }]
    setGuesses(next)
    if (correct) endRound(true, false, next)
    else if (next.length >= MAX_ATTEMPTS) endRound(false, false, next)
  }

  // Reveal the answer immediately, ending the round as a loss.
  const giveUp = () => {
    if (status === 'playing' && game) endRound(false, true, guesses)
  }

  // Advance from the between-round reveal to the next round (or the scorecard).
  const goNext = () => {
    if (!game) return
    const next = roundIndex + 1
    if (next >= game.targets.length) {
      setStatus('done')
    } else {
      setRoundIndex(next)
      setGuesses([])
      setStatus('playing')
    }
  }

  const startShared = () => {
    if (pendingTargetIds) beginGame(pendingTargetIds)
    setPendingTargetIds(null)
    clearChallengeFromUrl()
  }

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses])
  const options = useMemo(
    () => (game ? game.options.filter((p) => !guessedIds.has(p.id)) : []),
    [game, guessedIds],
  )

  const poolEmpty = poolReady && pool.length === 0
  const attemptsLeft = MAX_ATTEMPTS - guesses.length
  const dirty = game !== null && status === 'playing' && game.key !== liveKey
  const startDisabled = !poolReady || pool.length === 0 || (guessFromAll && namesLoading)
  const inGame = game !== null && (status === 'playing' || status === 'reveal')
  const solvedSoFar = outcomes.filter((o) => o.solved).length
  const lastOutcome = outcomes[outcomes.length - 1]

  // What's actually revealed this round, after any hint unlocks.
  const reveal = game && target ? effectiveReveal(game.settings, guesses.length) : settings
  const showMeta = reveal.height || reveal.weight || reveal.ability
  const sharedReady = pendingTargetIds !== null && poolReady && !(guessFromAll && namesLoading)

  // The current game expressed as a shareable challenge (multi-round aware).
  const gameChallenge: Challenge | null = game
    ? {
        v: 1,
        pokemonIds: game.targets.map((t) => t.id),
        generations: game.generations,
        filters: game.filters,
        finalOnly: game.finalOnly,
        settings: game.settings,
        guessFromAll: game.guessFromAll,
        ...(game.listIds ? { listIds: game.listIds } : {}),
      }
    : null

  return (
    <div className="quiz">
      <aside className="quiz-side panel">
        <h2>Quiz setup</h2>
        <QuizPool
          source={source}
          onSource={setSource}
          generations={generations}
          onGenerations={setGenerations}
          finalOnly={finalOnly}
          onFinalOnly={setFinalOnly}
          finalLoading={finalLoading}
          guessFromAll={guessFromAll}
          onGuessFromAll={setGuessFromAll}
          rounds={rounds}
          onRounds={setRounds}
        />
        <QuizSettings settings={settings} onChange={setSettings} />
        <FilterControls filters={filters} onChange={setFilters} />
      </aside>

      <section className="quiz-stage panel">
        <div className="quiz-status">
          {inGame && game ? (
            <span className="muted">
              Round {roundIndex + 1} of {game.rounds}
              {game.rounds > 1 && ` · solved ${solvedSoFar}`}
            </span>
          ) : sourceInputCount === 0 ? (
            <span className="muted">
              {isGens
                ? 'Pick at least one generation to draw from.'
                : 'This list has no Pokémon yet — add some or pick another source.'}
            </span>
          ) : poolLoading ? (
            <span className="muted">
              Loading {finalLoading ? 'evolution data' : 'pool'}...{' '}
              {isGens && !finalLoading && `${Math.round(genSummaries.progress * 100)}%`}
            </span>
          ) : (
            <span className="muted">
              {pool.length} Pokémon {pool.length === 1 ? 'matches' : 'match'} your filters
            </span>
          )}

          {status === 'playing' && game && (
            <button type="button" className="giveup-btn" onClick={giveUp}>
              Give up
            </button>
          )}
          {status === 'reveal' && game && (
            <button type="button" className="primary-btn" onClick={goNext}>
              {roundIndex + 1 >= game.targets.length ? 'See results →' : 'Next Pokémon →'}
            </button>
          )}
          {status === 'done' && game && (
            <button type="button" className="primary-btn" onClick={() => beginGame()}>
              ↻ Play again
            </button>
          )}
        </div>

        {status === 'idle' && poolEmpty && (
          <p className="empty-state empty-state--big">
            No valid Pokémon from these filters. Please adjust filters.
          </p>
        )}

        {status === 'idle' && !poolEmpty && pendingTargetIds !== null && (
          <div className="quiz-empty">
            <p className="muted">
              {sharedReady
                ? `Someone shared a challenge with you — the exact ${
                    pendingTargetIds.length > 1 ? `${pendingTargetIds.length} Pokémon` : 'Pokémon'
                  }, filters, and reveal settings are loaded on the left.`
                : 'Loading the shared challenge...'}
            </p>
            <button type="button" className="primary-btn" onClick={startShared} disabled={!sharedReady}>
              Start shared challenge
            </button>
          </div>
        )}

        {status === 'idle' && !poolEmpty && pendingTargetIds === null && (
          <div className="quiz-empty">
            <p className="muted">
              {rounds === 1
                ? `Name the Pokémon from the available hints within ${MAX_ATTEMPTS} guesses.`
                : `Name ${rounds} Pokémon in a row, ${MAX_ATTEMPTS} guesses each, then see your score.`}{' '}
              You can pick from the dropdown or type the name.
            </p>
            <button type="button" className="primary-btn" onClick={() => beginGame()} disabled={startDisabled}>
              {rounds === 1 ? 'Start quiz' : `Start ${rounds}-round game`}
            </button>
          </div>
        )}

        {status === 'playing' && game && target && (
          <>
            <div className="round-bar">
              <button type="button" className="reset-btn" onClick={() => beginGame()}>
                ↻ Restart
              </button>
              {dirty && (
                <span className="round-bar-note">Setup changed — restart to apply changes</span>
              )}
            </div>

            <div className="quiz-card">
              <div className={`quiz-sprite-box ${reveal.image === 'blur' ? 'quiz-sprite-box--blur' : ''}`}>
                {reveal.image === 'hide' ? (
                  <span className="quiz-hidden">?</span>
                ) : (
                  <img
                    src={target.sprite}
                    alt="Mystery Pokémon"
                    className={`quiz-img ${reveal.image === 'blur' ? 'quiz-img--blur' : ''}`}
                  />
                )}
              </div>

              {reveal.type && (
                <div className="types">
                  {target.types.map((t) => (
                    <span key={t} className={`type type-${t}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {reveal.baseStats && <StatBars stats={target.stats} bst={target.bst} highlight="bst" />}

              {reveal.cry && <CryButton src={targetDetail.data?.cries?.latest ?? null} />}

              {showMeta && (
                <div className="meta meta--reveal">
                  {reveal.height && (
                    <div>
                      <span className="meta-label">Height</span>
                      <span>{targetDetail.data ? `${targetDetail.data.height / 10} m` : '...'}</span>
                    </div>
                  )}
                  {reveal.weight && (
                    <div>
                      <span className="meta-label">Weight</span>
                      <span>{targetDetail.data ? `${targetDetail.data.weight / 10} kg` : '...'}</span>
                    </div>
                  )}
                  {reveal.ability && (
                    <div>
                      <span className="meta-label">Abilities</span>
                      <span>
                        {targetDetail.data
                          ? targetDetail.data.abilities.map((a) => a.ability.name).join(', ')
                          : '...'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="quiz-guess-area">
                <div className="attempts">
                  <span>
                    Attempt {guesses.length + 1} of {MAX_ATTEMPTS}
                  </span>
                  <span className="attempt-dots">
                    {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
                      <span
                        key={i}
                        className={`attempt-dot ${i < guesses.length ? 'attempt-dot--used' : ''}`}
                      />
                    ))}
                  </span>
                </div>

                <NameComboBox
                  options={options}
                  onSelect={submitGuess}
                  disabled={options.length === 0}
                  showSprites={reveal.image === 'hide'}
                />

                {guesses.length > 0 && (
                  <ul className="guess-chips">
                    {guesses.map((g, i) => (
                      <li key={i} className="guess-chip guess-chip--wrong">
                        {g.name} ✗
                      </li>
                    ))}
                  </ul>
                )}
                <p className="hint-text">
                  {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left
                  {game.settings.hints && ' · hints on'}
                </p>
              </div>
            </div>
          </>
        )}

        {status === 'reveal' && game && target && lastOutcome && (
          <div className="quiz-result">
            <p className={`result-banner ${lastOutcome.solved ? 'good' : 'off'}`}>
              {lastOutcome.solved
                ? `Solved in ${lastOutcome.guessCount} ${lastOutcome.guessCount === 1 ? 'guess' : 'guesses'}!`
                : lastOutcome.gaveUp
                  ? 'You gave up – it was...'
                  : 'You ran out of attempts – it was...'}
            </p>
            <RevealedPokemon target={target} />
            <div className="result-actions">
              <button type="button" className="primary-btn" onClick={goNext}>
                {roundIndex + 1 >= game.targets.length ? 'See results →' : 'Next Pokémon →'}
              </button>
            </div>
          </div>
        )}

        {status === 'done' && game && lastOutcome && (
          game.rounds === 1 ? (
            <QuizResult
              won={lastOutcome.solved}
              gaveUp={lastOutcome.gaveUp}
              target={game.targets[0]}
              guesses={guesses}
              settings={game.settings}
              filters={game.filters}
              generations={game.generations}
              finalOnly={game.finalOnly}
              listIds={game.listIds}
              guessFromAll={game.guessFromAll}
              onPlayAgain={() => beginGame()}
            />
          ) : (
            <Scorecard
              outcomes={outcomes}
              challenge={gameChallenge}
              onPlayAgain={() => beginGame()}
            />
          )
        )}
      </section>
    </div>
  )
}
