const BASE_URL = 'https://pokeapi.co/api/v2'

export type PokemonListEntry = {
  name: string
  url: string
  id: number
}

export type PokemonListResponse = {
  count: number
  results: PokemonListEntry[]
}

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
}

const idFromUrl = (url: string): number => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}

export async function fetchPokemonList(limit = 24, offset = 0): Promise<PokemonListResponse> {
  const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error(`Failed to load Pokemon list: ${res.status}`)
  const data = await res.json()
  return {
    count: data.count,
    results: data.results.map((entry: { name: string; url: string }) => ({
      ...entry,
      id: idFromUrl(entry.url),
    })),
  }
}

export async function fetchPokemon(idOrName: string | number): Promise<Pokemon> {
  const res = await fetch(`${BASE_URL}/pokemon/${idOrName}`)
  if (!res.ok) throw new Error(`Failed to load Pokemon ${idOrName}: ${res.status}`)
  return res.json()
}
