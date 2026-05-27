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
import { clearChallengeFromUrl, readChallengeFromUrl } from '../util/share'
import { CryButton } from './CryButton'
import { FilterControls } from './FilterControls'
import { NameComboBox } from './NameComboBox'
import { QuizPool, type PoolSource } from './QuizPool'
import { QuizResult } from './QuizResult'
import { QuizSettings } from './QuizSettings'
import { StatBars } from './StatBars'

type Status = 'idle' | 'playing' | 'won' | 'lost'
type Guess = { id: number; name: string; correct: boolean }

/** A frozen snapshot of the setup for the round in progress. Changing the live
 *  controls never affects this — the player must restart to apply changes. */
type Round = {
  target: PokemonSummary
  options: NameOption[] // frozen guess dropdown (the pool, or all Pokémon)
  settings: Settings // the *configured* reveal settings (what gets shared)
  guessFromAll: boolean
  filters: PokemonFilters
  generations: number[]
  finalOnly: boolean
  listIds?: number[]
  key: string // config signature, to detect when the live setup has diverged
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
  const [pendingTargetId, setPendingTargetId] = useState<number | null>(
    () => challenge?.pokemonId ?? null,
  )

  const [round, setRound] = useState<Round | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
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
  const targetDetail = usePokemonQuery(round?.target.id ?? null)

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

  // Signature of the live setup; if it differs from the round's, offer a restart.
  const liveKey = useMemo(
    () => JSON.stringify({ generations, filters, finalOnly, source, settings, guessFromAll, listIds }),
    [generations, filters, finalOnly, source, settings, guessFromAll, listIds],
  )

  const beginRound = (targetId?: number, avoidId?: number) => {
    let chosen: PokemonSummary | undefined
    if (targetId != null) {
      chosen = pokemon.find((p) => p.id === targetId)
    } else if (pool.length > 0) {
      chosen = pool[Math.floor(Math.random() * pool.length)]
      if (pool.length > 1 && avoidId !== undefined) {
        while (chosen.id === avoidId) chosen = pool[Math.floor(Math.random() * pool.length)]
      }
    }
    if (!chosen) {
      setRound(null)
      setStatus('idle')
      return
    }
    setRound({
      target: chosen,
      options: guessFromAll ? allNames : pool,
      settings,
      guessFromAll,
      filters,
      generations,
      finalOnly,
      listIds: challengeListIds,
      key: liveKey,
    })
    setGuesses([])
    setStatus('playing')
  }

  // Reveal the answer immediately, ending the round as a loss.
  const giveUp = () => {
    if (status === 'playing') setStatus('lost')
  }

  const startShared = () => {
    if (pendingTargetId !== null) beginRound(pendingTargetId)
    setPendingTargetId(null)
    clearChallengeFromUrl()
  }

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses])
  const options = useMemo(
    () => (round ? round.options.filter((p) => !guessedIds.has(p.id)) : []),
    [round, guessedIds],
  )

  const submitGuess = (guess: NameOption) => {
    if (status !== 'playing' || !round) return
    const correct = guess.id === round.target.id
    const next = [...guesses, { id: guess.id, name: guess.name, correct }]
    setGuesses(next)
    if (correct) setStatus('won')
    else if (next.length >= MAX_ATTEMPTS) setStatus('lost')
  }

  const poolEmpty = poolReady && pool.length === 0
  const attemptsLeft = MAX_ATTEMPTS - guesses.length
  const dirty = round !== null && status === 'playing' && round.key !== liveKey
  const startDisabled = !poolReady || pool.length === 0 || (guessFromAll && namesLoading)

  // What's actually revealed this round, after any hint unlocks.
  const reveal = round ? effectiveReveal(round.settings, guesses.length) : settings
  const showMeta = reveal.height || reveal.weight || reveal.ability
  const sharedReady = pendingTargetId !== null && poolReady && !(guessFromAll && namesLoading)

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
        />
        <QuizSettings settings={settings} onChange={setSettings} />
        <FilterControls filters={filters} onChange={setFilters} />
      </aside>

      <section className="quiz-stage panel">
        <div className="quiz-status">
          {sourceInputCount === 0 ? (
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

          {status === 'playing' && round && (
            <button type="button" className="giveup-btn" onClick={giveUp}>
              Give up
            </button>
          )}
          {(status === 'won' || status === 'lost') && round && (
            <button
              type="button"
              className="primary-btn"
              onClick={() => beginRound(undefined, round.target.id)}
            >
              ↻ Play again
            </button>
          )}
        </div>

        {status === 'idle' && poolEmpty && (
          <p className="empty-state empty-state--big">
            No valid Pokémon from these filters. Please adjust filters.
          </p>
        )}

        {status === 'idle' && !poolEmpty && pendingTargetId !== null && (
          <div className="quiz-empty">
            <p className="muted">
              {sharedReady
                ? 'Someone shared a challenge with you — the exact Pokémon, filters, and reveal settings are loaded on the left.'
                : 'Loading the shared challenge...'}
            </p>
            <button type="button" className="primary-btn" onClick={startShared} disabled={!sharedReady}>
              Start shared challenge
            </button>
          </div>
        )}

        {status === 'idle' && !poolEmpty && pendingTargetId === null && (
          <div className="quiz-empty">
            <p className="muted">
              Name the Pokémon from the available hints within {MAX_ATTEMPTS} guesses. You can pick from the
              dropdown or type the name of the Pokémon.
            </p>
            <button type="button" className="primary-btn" onClick={() => beginRound()} disabled={startDisabled}>
              Start quiz
            </button>
          </div>
        )}

        {status === 'playing' && round && (
          <>
            <div className="round-bar">
              <button type="button" className="reset-btn" onClick={() => beginRound()}>
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
                    src={round.target.sprite}
                    alt="Mystery Pokémon"
                    className={`quiz-img ${reveal.image === 'blur' ? 'quiz-img--blur' : ''}`}
                  />
                )}
              </div>

              {reveal.type && (
                <div className="types">
                  {round.target.types.map((t) => (
                    <span key={t} className={`type type-${t}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {reveal.baseStats && (
                <StatBars stats={round.target.stats} bst={round.target.bst} highlight="bst" />
              )}

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
                  {round.settings.hints && ' · hints on'}
                </p>
              </div>
            </div>
          </>
        )}

        {(status === 'won' || status === 'lost') && round && (
          <QuizResult
            won={status === 'won'}
            gaveUp={status === 'lost' && guesses.length < MAX_ATTEMPTS}
            target={round.target}
            guesses={guesses}
            settings={round.settings}
            filters={round.filters}
            generations={round.generations}
            finalOnly={round.finalOnly}
            listIds={round.listIds}
            guessFromAll={round.guessFromAll}
            onPlayAgain={() => beginRound(undefined, round.target.id)}
          />
        )}
      </section>
    </div>
  )
}
