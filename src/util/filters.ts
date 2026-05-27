import type { PokemonSummary } from '../api/pokemon'
import { STAT_KEYS, STAT_LABELS, type StatKey } from '../constants/pokemon'

/** An optional lower/upper bound. `null` means "no bound on this side". */
export type Bound = { min: number | null; max: number | null }

/**
 * Stat/type filters shared by Browse and Quiz. Generation is intentionally not
 * here: which generations are loaded *is* the generation filter in both modes.
 */
export type PokemonFilters = {
  /** Match a Pokémon that has ANY of these types. Empty = all types. */
  types: string[]
  /** When true, match only Pokémon whose types are *exactly* this set (order-independent). */
  exactTypes: boolean
  bst: Bound
  stats: Record<StatKey, Bound>
}

const emptyBound = (): Bound => ({ min: null, max: null })

export function defaultFilters(): PokemonFilters {
  return {
    types: [],
    exactTypes: false,
    bst: emptyBound(),
    stats: Object.fromEntries(STAT_KEYS.map((k) => [k, emptyBound()])) as Record<StatKey, Bound>,
  }
}

const withinBound = (value: number, { min, max }: Bound): boolean =>
  (min === null || value >= min) && (max === null || value <= max)

export function matchesFilters(p: PokemonSummary, f: PokemonFilters): boolean {
  if (f.types.length > 0) {
    if (f.exactTypes) {
      // Exact match: same type set, ignoring order. No dupes on either side.
      if (p.types.length !== f.types.length || !f.types.every((t) => p.types.includes(t)))
        return false
    } else if (!f.types.some((t) => p.types.includes(t))) {
      return false
    }
  }
  if (!withinBound(p.bst, f.bst)) return false
  for (const key of STAT_KEYS) {
    if (!withinBound(p.stats[key], f.stats[key])) return false
  }
  return true
}

/** True if any bound or type filter is actually set. */
export function isFilterActive(f: PokemonFilters): boolean {
  if (f.types.length > 0) return true
  const bounds = [f.bst, ...STAT_KEYS.map((k) => f.stats[k])]
  return bounds.some((b) => b.min !== null || b.max !== null)
}

const describeBound = (label: string, { min, max }: Bound): string | null => {
  if (min !== null && max !== null) return `${label} ${min}–${max}`
  if (min !== null) return `${label} ≥ ${min}`
  if (max !== null) return `${label} ≤ ${max}`
  return null
}

/** Human-readable chips for the active stat/type filters (for the result screen). */
export function describeFilters(f: PokemonFilters): string[] {
  const chips: string[] = []
  if (f.types.length > 0)
    chips.push(`Type: ${f.types.join(' / ')}${f.exactTypes ? ' (exact)' : ''}`)
  const bst = describeBound('BST', f.bst)
  if (bst) chips.push(bst)
  for (const key of STAT_KEYS) {
    const chip = describeBound(STAT_LABELS[key], f.stats[key])
    if (chip) chips.push(chip)
  }
  return chips
}

// ---- Search ----

export function searchMatch(name: string, query: string, startsWith: boolean): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const n = name.toLowerCase()
  return startsWith ? n.startsWith(q) : n.includes(q)
}

// ---- Sorting ----

export type SortKey = 'id' | 'name' | 'bst' | StatKey
type SortDir = 'asc' | 'desc'
type SortState = { key: SortKey; dir: SortDir }

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Pokédex #' },
  { key: 'name', label: 'Name' },
  { key: 'bst', label: 'Base stat total' },
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'spAttack', label: 'Sp. Atk' },
  { key: 'spDefense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
]

function compareBy(a: PokemonSummary, b: PokemonSummary, key: SortKey): number {
  if (key === 'id') return a.id - b.id
  if (key === 'name') return a.name.localeCompare(b.name)
  if (key === 'bst') return a.bst - b.bst
  return a.stats[key] - b.stats[key]
}

export function sortPokemon(list: PokemonSummary[], sort: SortState): PokemonSummary[] {
  const sorted = [...list].sort((a, b) => {
    const primary = compareBy(a, b, sort.key)
    // Stable tiebreak by id so equal stats keep a predictable order.
    return primary !== 0 ? primary : a.id - b.id
  })
  return sort.dir === 'desc' ? sorted.reverse() : sorted
}
