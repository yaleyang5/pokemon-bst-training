import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'pokemon-bst-trainer:lists'

export type PokemonList = {
  id: string
  name: string
  pokemonIds: number[]
}

// A tiny external store so every component (cards, detail, the lists panel)
// reads the same list state and re-renders together. Lists live purely in
// localStorage — no react-query, no network, no artificial latency.

let lists: PokemonList[] = load()
const subscribers = new Set<() => void>()

function load(): PokemonList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((l) => l && typeof l.id === 'string' && typeof l.name === 'string')
      .map((l) => ({
        id: l.id,
        name: l.name,
        pokemonIds: Array.isArray(l.pokemonIds)
          ? l.pokemonIds.filter((n: unknown) => typeof n === 'number')
          : [],
      }))
  } catch {
    return []
  }
}

function persist(next: PokemonList[]) {
  lists = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  subscribers.forEach((cb) => cb())
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

// Keep other tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      lists = load()
      subscribers.forEach((cb) => cb())
    }
  })
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `list_${Date.now()}_${Math.random().toString(36).slice(2)}`

export const listsStore = {
  createList(name: string): PokemonList {
    const list: PokemonList = { id: newId(), name: name.trim() || 'Untitled list', pokemonIds: [] }
    persist([...lists, list])
    return list
  },
  renameList(id: string, name: string) {
    persist(lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)))
  },
  deleteList(id: string) {
    persist(lists.filter((l) => l.id !== id))
  },
  addToList(listId: string, pokemonId: number) {
    persist(
      lists.map((l) =>
        l.id === listId && !l.pokemonIds.includes(pokemonId)
          ? { ...l, pokemonIds: [...l.pokemonIds, pokemonId] }
          : l,
      ),
    )
  },
  removeFromList(listId: string, pokemonId: number) {
    persist(
      lists.map((l) =>
        l.id === listId ? { ...l, pokemonIds: l.pokemonIds.filter((id) => id !== pokemonId) } : l,
      ),
    )
  },
  toggleInList(listId: string, pokemonId: number) {
    const list = lists.find((l) => l.id === listId)
    if (!list) return
    if (list.pokemonIds.includes(pokemonId)) this.removeFromList(listId, pokemonId)
    else this.addToList(listId, pokemonId)
  },
}

export function useLists(): PokemonList[] {
  return useSyncExternalStore(subscribe, () => lists)
}
