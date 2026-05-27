import { useLists } from '../hooks/useLists'
import { GenerationSelector } from './GenerationSelector'

/** Where the quiz draws Pokémon from. */
export type PoolSource =
  | { kind: 'gens' }
  | { kind: 'list'; id: string }
  | { kind: 'shared'; ids: number[] } // a list embedded in a shared challenge

type Props = {
  source: PoolSource
  onSource: (source: PoolSource) => void
  generations: number[]
  onGenerations: (gens: number[]) => void
  finalOnly: boolean
  onFinalOnly: (value: boolean) => void
  finalLoading: boolean
  /** Whether the guess dropdown offers every Pokémon vs only the pool. */
  guessFromAll: boolean
  onGuessFromAll: (value: boolean) => void
}

export function QuizPool({
  source,
  onSource,
  generations,
  onGenerations,
  finalOnly,
  onFinalOnly,
  finalLoading,
  guessFromAll,
  onGuessFromAll,
}: Props) {
  const lists = useLists()

  const selectValue =
    source.kind === 'gens' ? 'gens' : source.kind === 'list' ? `list:${source.id}` : 'shared'

  const onSelectChange = (value: string) => {
    if (value === 'gens') onSource({ kind: 'gens' })
    else if (value.startsWith('list:')) onSource({ kind: 'list', id: value.slice(5) })
  }

  const activeList = source.kind === 'list' ? lists.find((l) => l.id === source.id) : null
  const sourceCount =
    source.kind === 'list' ? activeList?.pokemonIds.length ?? 0 : source.kind === 'shared' ? source.ids.length : 0
  const sourceName = source.kind === 'shared' ? 'a shared list' : activeList?.name ?? 'a list'

  return (
    <div className="quiz-settings">
      <div className="filter-group">
        <h3>Pool</h3>

        <label className="setting-row">
          <span className="setting-label">Quiz from</span>
          <select value={selectValue} onChange={(e) => onSelectChange(e.target.value)}>
            <option value="gens">By generation</option>
            {lists.map((list) => (
              <option key={list.id} value={`list:${list.id}`}>
                List: {list.name} ({list.pokemonIds.length})
              </option>
            ))}
            {source.kind === 'shared' && <option value="shared">Shared list ({source.ids.length})</option>}
          </select>
        </label>

        {source.kind === 'gens' ? (
          <>
            <GenerationSelector selected={generations} onChange={onGenerations} />
            <label className="switch-row">
              <input
                type="checkbox"
                checked={finalOnly}
                onChange={(e) => onFinalOnly(e.target.checked)}
              />
              <span>Final evolutions only</span>
              {finalLoading && <span className="hint-text">loading…</span>}
            </label>
          </>
        ) : (
          <p className="hint-text">
            Quizzing from {sourceName} — {sourceCount} Pokémon. The filters below still apply.
          </p>
        )}

        <label className="switch-row">
          <input
            type="checkbox"
            checked={guessFromAll}
            onChange={(e) => onGuessFromAll(e.target.checked)}
          />
          <span>Dropdown lists all Pokémon</span>
        </label>
        <p className="hint-text">
          {guessFromAll
            ? 'The dropdown lists every Pokémon, not just the pool.'
            : 'The dropdown lists only Pokémon in the pool above.'}
        </p>
      </div>
    </div>
  )
}
