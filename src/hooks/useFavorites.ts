import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFavorites, toggleFavorite } from '../api/favorites'
import { QUERY_KEYS } from '../constants/queryKeys'

const favoritesKey = [QUERY_KEYS.FAVORITES] as const

export function useFavoritesQuery() {
  return useQuery({
    queryKey: favoritesKey,
    queryFn: fetchFavorites,
  })
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (pokemonId: number) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous = queryClient.getQueryData<number[]>(favoritesKey) ?? []
      const optimistic = previous.includes(pokemonId)
        ? previous.filter((id) => id !== pokemonId)
        : [...previous, pokemonId]
      queryClient.setQueryData<number[]>(favoritesKey, optimistic)
      return { previous }
    },
    onError: (_err, _pokemonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData<number[]>(favoritesKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesKey })
    },
  })
}
