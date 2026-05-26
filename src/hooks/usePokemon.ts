import { useQuery } from '@tanstack/react-query'
import { fetchPokemon, fetchPokemonList } from '../api/pokemon'
import { QUERY_KEYS } from '../constants/queryKeys'

export function usePokemonListQuery(limit = 24, offset = 0) {
  return useQuery({
    queryKey: [QUERY_KEYS.POKEMON, 'list', { limit, offset }],
    queryFn: () => fetchPokemonList(limit, offset),
  })
}

export function usePokemonQuery(idOrName: string | number | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.POKEMON, 'detail', idOrName ?? ''],
    queryFn: () => fetchPokemon(idOrName!),
    enabled: idOrName !== null && idOrName !== '',
  })
}

// Store -> Zustand Stores
// Query -> GET
// Mutation -> POST, PUT, DELETE
