import type { PokemonFilters } from './filters'
import type { QuizSettings } from './quiz'

/** A fully-specified quiz challenge that can be recreated from a link. */
export type Challenge = {
  v: 1
  pokemonId: number
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

// base64url so the payload is safe to drop in a URL fragment.
const toBase64Url = (json: string): string =>
  btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (s: string): string => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

function encodeChallenge(challenge: Challenge): string {
  return toBase64Url(JSON.stringify(challenge))
}

function decodeChallenge(encoded: string): Challenge | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded))
    if (parsed && parsed.v === 1 && typeof parsed.pokemonId === 'number') return parsed as Challenge
    return null
  } catch {
    return null
  }
}

export function buildShareUrl(challenge: Challenge): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#challenge=${encodeChallenge(challenge)}`
}

/** Read a challenge from the current URL fragment, if any. */
export function readChallengeFromUrl(): Challenge | null {
  const match = window.location.hash.match(/challenge=([^&]+)/)
  return match ? decodeChallenge(match[1]) : null
}

/** Drop the challenge fragment so reloads/new rounds don't replay it. */
export function clearChallengeFromUrl(): void {
  if (window.location.hash.includes('challenge=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
