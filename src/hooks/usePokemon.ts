import { useQueries, useQuery } from '@tanstack/react-query'
import {
  fetchAllNames,
  fetchGenerationSummaries,
  fetchPokemon,
  toSummary,
  type NameOption,
  type PokemonSummary,
} from '../api/pokemon'
import { QUERY_KEYS } from '../constants/queryKeys'

// Base stats never change, so once a generation (or a detail) is fetched we can
// keep it forever — switching generations back and forth is then instant.
const FOREVER = { staleTime: Infinity, gcTime: Infinity } as const

/** Full `/pokemon/{id}` record for the detail view. */
export function usePokemonQuery(idOrName: string | number | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.POKEMON, 'detail', idOrName ?? ''],
    queryFn: () => fetchPokemon(idOrName!),
    enabled: idOrName !== null && idOrName !== '',
    ...FOREVER,
  })
}

export type GenerationSummaries = {
  /** Merged, id-sorted summaries across every selected generation that loaded. */
  pokemon: PokemonSummary[]
  isLoading: boolean
  isError: boolean
  /** Fraction (0–1) of selected generations that have finished loading. */
  progress: number
}

/**
 * Load summaries for the selected generations. One cached query per generation
 * (via `useQueries`) keeps fetching incremental and lets results stream in as
 * each generation resolves.
 */
export function useGenerationSummaries(generations: number[]): GenerationSummaries {
  const sorted = [...generations].sort((a, b) => a - b)

  const queries = useQueries({
    queries: sorted.map((gen) => ({
      queryKey: [QUERY_KEYS.GENERATION, gen],
      queryFn: () => fetchGenerationSummaries(gen),
      ...FOREVER,
    })),
  })

  const pokemon = queries
    .flatMap((q) => q.data ?? [])
    .sort((a, b) => a.id - b.id)

  const settled = queries.filter((q) => q.isSuccess || q.isError).length

  return {
    pokemon,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    progress: queries.length === 0 ? 1 : settled / queries.length,
  }
}

/**
 * Summaries for an explicit set of ids (used when quizzing from a saved list).
 * Each id reuses the per-Pokémon detail query, so it shares cache with the
 * detail view and only fetches the list's members — not whole generations.
 */
export function useListSummaries(ids: number[]): { pokemon: PokemonSummary[]; isLoading: boolean } {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: [QUERY_KEYS.POKEMON, 'detail', id],
      queryFn: () => fetchPokemon(id),
      ...FOREVER,
    })),
  })

  const pokemon = queries
    .flatMap((q) => (q.data ? [toSummary(q.data)] : []))
    .sort((a, b) => a.id - b.id)

  return { pokemon, isLoading: queries.some((q) => q.isLoading) }
}

/**
 * The full list of base-form Pokémon names, for the "guess from all Pokémon"
 * dropdown. Lazily fetched (one request) and cached for the session.
 */
export function useAllNames(enabled: boolean): { names: NameOption[]; isLoading: boolean } {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ALL_NAMES],
    queryFn: fetchAllNames,
    enabled,
    ...FOREVER,
  })
  return { names: query.data ?? [], isLoading: enabled && query.isLoading }
}
