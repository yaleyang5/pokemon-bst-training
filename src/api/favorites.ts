const STORAGE_KEY = 'react-query-showcase:favorites'
const LATENCY_MS = 1500
const FAILURE_RATE = 0

const read = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

const write = (ids: number[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const maybeFail = () => {
  if (FAILURE_RATE > 0 && Math.random() < FAILURE_RATE) {
    throw new Error('Simulated favorites server error')
  }
}

export async function fetchFavorites(): Promise<number[]> {
  await delay(LATENCY_MS)
  maybeFail()
  return read()
}

export async function toggleFavorite(pokemonId: number): Promise<number[]> {
  await delay(LATENCY_MS)
  maybeFail()
  const current = read()
  const next = current.includes(pokemonId)
    ? current.filter((id) => id !== pokemonId)
    : [...current, pokemonId]
  write(next)
  return next
}
