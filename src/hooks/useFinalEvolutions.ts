import { useQuery } from '@tanstack/react-query'
import { fetchFinalEvolutionIds } from '../api/pokemon'
import { QUERY_KEYS } from '../constants/queryKeys'

export type FinalEvolutions = {
  /** Set of fully-evolved national-dex ids, or null until loaded. */
  finalIds: Set<number> | null
  isLoading: boolean
  isError: boolean
}

/**
 * Lazily fetch the set of final-evolution ids. Only runs when `enabled` (the
 * quiz's "final evolutions only" toggle); evolution data never changes, so the
 * result is cached for the session.
 */
export function useFinalEvolutions(enabled: boolean): FinalEvolutions {
  const query = useQuery({
    queryKey: [QUERY_KEYS.FINAL_EVOLUTIONS],
    queryFn: fetchFinalEvolutionIds,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    finalIds: query.data ? new Set(query.data) : null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  }
}
