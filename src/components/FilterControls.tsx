import { ALL_TYPES, MAX_BST, MAX_STAT, STAT_KEYS, STAT_LABELS, type StatKey } from '../constants/pokemon'
import { defaultFilters, type Bound, type PokemonFilters } from '../util/filters'

type Props = {
  filters: PokemonFilters
  onChange: (filters: PokemonFilters) => void
}

/** A blank string clears the bound; otherwise parse to a number. */
const parseBound = (raw: string): number | null => {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function BoundInputs({
  label,
  max,
  value,
  onChange,
}: {
  label: string
  max: number
  value: Bound
  onChange: (b: Bound) => void
}) {
  return (
    <div className="bound-row">
      <span className="bound-label">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        placeholder="min"
        value={value.min ?? ''}
        onChange={(e) => onChange({ ...value, min: parseBound(e.target.value) })}
        aria-label={`${label} minimum`}
      />
      <span className="bound-sep">–</span>
      <input
        type="number"
        min={0}
        max={max}
        placeholder="max"
        value={value.max ?? ''}
        onChange={(e) => onChange({ ...value, max: parseBound(e.target.value) })}
        aria-label={`${label} maximum`}
      />
    </div>
  )
}

export function FilterControls({ filters, onChange }: Props) {
  const toggleType = (type: string) => {
    onChange({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type],
    })
  }

  const setStat = (key: StatKey, bound: Bound) => {
    onChange({ ...filters, stats: { ...filters.stats, [key]: bound } })
  }

  return (
    <div className="filter-controls">
      <div className="filter-group">
        <div className="filter-group-head">
          <h3>Types</h3>
          {filters.types.length > 0 && (
            <button type="button" className="link-btn" onClick={() => onChange({ ...filters, types: [] })}>
              clear
            </button>
          )}
        </div>
        <p className="hint-text">
          {filters.exactTypes
            ? 'Matches only Pokémon with exactly this type combination.'
            : 'Matches a Pokémon with any selected type.'}
        </p>
        <div className="type-chips">
          {ALL_TYPES.map((type) => {
            const active = filters.types.includes(type)
            return (
              <button
                key={type}
                type="button"
                className={`type type-${type} type-chip ${active ? 'type-chip--on' : 'type-chip--off'}`}
                aria-pressed={active}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            )
          })}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.exactTypes}
            onChange={(e) => onChange({ ...filters, exactTypes: e.target.checked })}
          />
          Only this exact type combination
        </label>
      </div>

      <div className="filter-group">
        <h3>Base stat total</h3>
        <BoundInputs
          label="BST"
          max={MAX_BST}
          value={filters.bst}
          onChange={(b) => onChange({ ...filters, bst: b })}
        />
      </div>

      <div className="filter-group">
        <h3>Individual stats</h3>
        {STAT_KEYS.map((key) => (
          <BoundInputs
            key={key}
            label={STAT_LABELS[key]}
            max={MAX_STAT}
            value={filters.stats[key]}
            onChange={(b) => setStat(key, b)}
          />
        ))}
      </div>

      <button type="button" className="reset-btn" onClick={() => onChange(defaultFilters())}>
        Reset filters
      </button>
    </div>
  )
}
