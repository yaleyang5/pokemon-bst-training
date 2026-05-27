import { GENERATIONS, STAT_KEYS } from '../constants/pokemon'
import { defaultFilters, type Bound, type PokemonFilters } from './filters'
import { defaultQuizSettings, normalizeSettings, type QuizSettings } from './quiz'

/** A fully-specified quiz challenge that can be recreated from a link. */
export type Challenge = {
  v: 1
  /**
   * The ordered targets. Length 1 is a single-round quiz; length > 1 is a
   * multi-round game played in this order. A recipient gets these exact ids.
   */
  pokemonIds: number[]
  generations: number[]
  filters: PokemonFilters
  finalOnly: boolean
  settings: QuizSettings
  /**
   * Present when the quiz drew from a saved list. The member ids are embedded
   * so a recipient (who doesn't have the list) gets the same pool. When set,
   * `generations`/`finalOnly` are ignored.
   */
  listIds?: number[]
  /** Whether the guess dropdown offered every Pokémon (vs only the pool). */
  guessFromAll?: boolean
}

/** The ordered target ids of a challenge. */
export function challengeTargetIds(c: Challenge): number[] {
  return c.pokemonIds
}

const ALL_GENS = GENERATIONS.map((g) => g.gen)

// base64url so the payload is query-safe (only A–Z a–z 0–9 - _).
const toBase64Url = (json: string): string =>
  btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (s: string): string => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

// ---- Compact wire format -------------------------------------------------
// The link only carries values that differ from the defaults; the rest is
// filled back in on decode. This keeps URLs short enough to survive the link
// detection in messaging apps (which truncate or split very long URLs).

type WireBound = { min?: number; max?: number }

function compactBound(b: Bound): WireBound | undefined {
  const out: WireBound = {}
  if (b.min != null) out.min = b.min
  if (b.max != null) out.max = b.max
  return out.min === undefined && out.max === undefined ? undefined : out
}

const expandBound = (b: WireBound | undefined): Bound => ({ min: b?.min ?? null, max: b?.max ?? null })

function compactFilters(f: PokemonFilters): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {}
  if (f.types.length > 0) out.types = f.types
  if (f.exactTypes) out.exactTypes = true
  const bst = compactBound(f.bst)
  if (bst) out.bst = bst
  const stats: Record<string, WireBound> = {}
  for (const k of STAT_KEYS) {
    const wb = compactBound(f.stats[k])
    if (wb) stats[k] = wb
  }
  if (Object.keys(stats).length > 0) out.stats = stats
  return Object.keys(out).length > 0 ? out : undefined
}

function expandFilters(raw: unknown): PokemonFilters {
  const f = (raw ?? {}) as {
    types?: unknown
    exactTypes?: unknown
    bst?: WireBound
    stats?: Partial<Record<string, WireBound>>
  }
  if (typeof f !== 'object') return defaultFilters()
  return {
    types: Array.isArray(f.types) ? (f.types as string[]) : [],
    exactTypes: f.exactTypes === true,
    bst: expandBound(f.bst),
    stats: Object.fromEntries(
      STAT_KEYS.map((k) => [k, expandBound(f.stats?.[k])]),
    ) as PokemonFilters['stats'],
  }
}

function compactSettings(s: QuizSettings): Partial<QuizSettings> | undefined {
  const d = defaultQuizSettings()
  const out: Partial<QuizSettings> = {}
  for (const k of Object.keys(d) as (keyof QuizSettings)[]) {
    if (s[k] !== d[k]) (out as Record<string, unknown>)[k] = s[k]
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function encodeChallenge(c: Challenge): string {
  const out: Record<string, unknown> = { v: 1, pokemonIds: c.pokemonIds }

  if (c.listIds && c.listIds.length > 0) {
    // A shared list pool replaces generations/finalOnly entirely.
    out.listIds = c.listIds
  } else {
    const allGens =
      c.generations.length === ALL_GENS.length && ALL_GENS.every((g) => c.generations.includes(g))
    if (!allGens) out.generations = c.generations
    if (c.finalOnly) out.finalOnly = true
  }

  const filters = compactFilters(c.filters)
  if (filters) out.filters = filters
  const settings = compactSettings(c.settings)
  if (settings) out.settings = settings
  if (c.guessFromAll) out.guessFromAll = true

  return toBase64Url(JSON.stringify(out))
}

function decodeChallenge(encoded: string): Challenge | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded))
    if (!raw || raw.v !== 1 || !Array.isArray(raw.pokemonIds) || raw.pokemonIds.length === 0)
      return null

    const hasList = Array.isArray(raw.listIds) && raw.listIds.length > 0
    return {
      v: 1,
      pokemonIds: raw.pokemonIds,
      generations: Array.isArray(raw.generations) ? raw.generations : ALL_GENS,
      filters: expandFilters(raw.filters),
      finalOnly: raw.finalOnly === true,
      settings: normalizeSettings(raw.settings),
      guessFromAll: raw.guessFromAll === true,
      ...(hasList ? { listIds: raw.listIds } : {}),
    }
  } catch {
    return null
  }
}

export function buildShareUrl(challenge: Challenge): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}?challenge=${encodeChallenge(challenge)}`
}

/** Read a challenge from the current URL's `?challenge=` query param, if any. */
export function readChallengeFromUrl(): Challenge | null {
  const encoded = new URLSearchParams(window.location.search).get('challenge')
  return encoded ? decodeChallenge(encoded) : null
}

/** Drop the challenge query param so reloads/new rounds don't replay it. */
export function clearChallengeFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('challenge')) return
  params.delete('challenge')
  const query = params.toString()
  history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
}
