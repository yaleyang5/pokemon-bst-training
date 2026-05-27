import {
  API_STAT_TO_KEY,
  GENERATION_BY_NUMBER,
  STAT_KEYS,
  generationForId,
  type StatKey,
} from '../constants/pokemon'

const BASE_URL = 'https://pokeapi.co/api/v2'

/** Raw shape returned by `/pokemon/{id}` (only the fields we use). */
export type Pokemon = {
  id: number
  name: string
  height: number
  weight: number
  sprites: {
    front_default: string | null
    other: {
      'official-artwork': { front_default: string | null }
    }
  }
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { ability: { name: string }; is_hidden: boolean }[]
  cries: { latest: string | null; legacy: string | null } | null
}

/**
 * Lightweight, list-ready view of a Pokémon with stats pre-flattened and the
 * base stat total computed once. This is what the grid, filters, sort, and the
 * quiz all operate on.
 */
export type PokemonSummary = {
  id: number
  name: string
  generation: number
  sprite: string
  types: string[]
  stats: Record<StatKey, number>
  bst: number
}

/** Official-artwork sprite, falling back to the front sprite or a CDN url. */
export function spriteFor(pokemon: Pokemon): string {
  return (
    pokemon.sprites.other['official-artwork'].front_default ??
    pokemon.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
  )
}

export function toSummary(pokemon: Pokemon): PokemonSummary {
  const stats = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 } as Record<
    StatKey,
    number
  >
  for (const entry of pokemon.stats) {
    const key = API_STAT_TO_KEY[entry.stat.name]
    if (key) stats[key] = entry.base_stat
  }
  const bst = STAT_KEYS.reduce((sum, key) => sum + stats[key], 0)
  return {
    id: pokemon.id,
    name: pokemon.name,
    generation: generationForId(pokemon.id),
    sprite: spriteFor(pokemon),
    types: pokemon.types.map((t) => t.type.name),
    stats,
    bst,
  }
}

export async function fetchPokemon(idOrName: string | number): Promise<Pokemon> {
  const res = await fetch(`${BASE_URL}/pokemon/${idOrName}`)
  if (!res.ok) throw new Error(`Failed to load Pokémon ${idOrName}: ${res.status}`)
  return res.json()
}

/** Minimal name/id/sprite, enough to populate a guess dropdown. */
export type NameOption = {
  id: number
  name: string
  sprite: string
}

const idFromUrl = (url: string): number => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

/** Every base-form Pokémon's name (national-dex ids 1–1025), for the "guess from
 *  all Pokémon" dropdown. One light request; variant forms (ids 10000+) excluded. */
export async function fetchAllNames(): Promise<NameOption[]> {
  const res = await fetch(`${BASE_URL}/pokemon?limit=20000`)
  if (!res.ok) throw new Error(`Failed to load Pokémon names: ${res.status}`)
  const data = await res.json()
  return (data.results as { name: string; url: string }[])
    .map((entry) => ({ id: idFromUrl(entry.url), name: entry.name }))
    .filter((p) => p.id >= 1 && p.id <= 1025)
    .map((p) => ({
      ...p,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
    }))
    .sort((a, b) => a.id - b.id)
}

/** Resolve promises in fixed-size batches to stay polite to the API. */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    out.push(...(await Promise.all(batch.map(fn))))
  }
  return out
}

/**
 * Fetch every base-form Pokémon in a generation and return them as summaries.
 * Ids that 404 (e.g. a not-yet-released generation) are skipped rather than
 * failing the whole batch.
 */
export async function fetchGenerationSummaries(gen: number): Promise<PokemonSummary[]> {
  const range = GENERATION_BY_NUMBER[gen]
  if (!range) return []

  const ids: number[] = []
  for (let id = range.start; id <= range.end; id++) ids.push(id)

  const results = await inBatches(ids, 25, async (id) => {
    try {
      return toSummary(await fetchPokemon(id))
    } catch {
      return null
    }
  })

  return results
    .filter((p): p is PokemonSummary => p !== null)
    .sort((a, b) => a.id - b.id)
}

// ---- Final evolutions ----

type ChainLink = {
  species: { name: string; url: string }
  evolves_to: ChainLink[]
}

const speciesIdFromUrl = (url: string): number => {
  const match = url.match(/\/pokemon-species\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

/** Collect the leaf (fully-evolved) species ids from one evolution chain. */
function collectLeafIds(node: ChainLink, into: Set<number>): void {
  if (node.evolves_to.length === 0) {
    into.add(speciesIdFromUrl(node.species.url))
  } else {
    for (const child of node.evolves_to) collectLeafIds(child, into)
  }
}

/**
 * Every fully-evolved species' national-dex id, derived from the full set of
 * evolution chains. A "final evolution" is a leaf in its chain, which also
 * covers single-stage Pokémon (their chain is a lone leaf). Computed across all
 * chains so cross-generation evolutions (e.g. Eevee → Sylveon) resolve
 * correctly. Fetched once and cached forever; only triggered by the quiz's
 * "final evolutions only" toggle.
 */
export async function fetchFinalEvolutionIds(): Promise<number[]> {
  const listRes = await fetch(`${BASE_URL}/evolution-chain?limit=2000`)
  if (!listRes.ok) throw new Error(`Failed to load evolution chains: ${listRes.status}`)
  const list: { results: { url: string }[] } = await listRes.json()

  const finals = new Set<number>()
  await inBatches(list.results, 30, async ({ url }) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data: { chain: ChainLink } = await res.json()
      collectLeafIds(data.chain, finals)
    } catch {
      /* skip a failed chain rather than failing the whole set */
    }
  })

  return [...finals].sort((a, b) => a - b)
}
