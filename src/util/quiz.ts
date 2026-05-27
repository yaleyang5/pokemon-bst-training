// Quiz display + difficulty settings, shared by the quiz UI and the share link.

type ImageMode = 'hide' | 'blur' | 'show'

export type QuizSettings = {
  /** How much of the sprite to reveal. `blur` is a barely-readable silhouette. */
  image: ImageMode
  /** Show the base-stat graph. At least one of `baseStats`/`cry` is always on. */
  baseStats: boolean
  /** Offer the Pokémon's cry as a clue. */
  cry: boolean
  type: boolean
  ability: boolean
  height: boolean
  weight: boolean
  /** Progressively reveal type/ability/height/weight after wrong guesses. */
  hints: boolean
}

/** Hardest sensible default: only the stat graph is shown. */
export function defaultQuizSettings(): QuizSettings {
  return {
    image: 'hide',
    baseStats: true,
    cry: false,
    type: false,
    ability: false,
    height: false,
    weight: false,
    hints: false,
  }
}

/** Tolerate older/partial share payloads by filling in any missing fields. */
export function normalizeSettings(partial: Partial<QuizSettings> | undefined): QuizSettings {
  const merged = { ...defaultQuizSettings(), ...partial }
  // Enforce the invariant in case a malformed link disabled both.
  if (!merged.baseStats && !merged.cry) merged.baseStats = true
  return merged
}

export const MAX_ATTEMPTS = 5

export const IMAGE_MODES: { value: ImageMode; label: string }[] = [
  { value: 'hide', label: 'Hide' },
  { value: 'blur', label: 'Blur' },
  { value: 'show', label: 'Show' },
]

/** The plain reveal toggles (rendered below base-stats/cry, in this order). */
export const REVEAL_FIELDS: { key: 'type' | 'ability' | 'height' | 'weight'; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'ability', label: 'Ability' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
]

/** What hints unlock and when (described to the player up front). */
export const HINT_SCHEDULE: { atGuess: number; label: string }[] = [
  { atGuess: 3, label: 'Type' },
  { atGuess: 4, label: 'Ability' },
  { atGuess: 5, label: 'Height & weight' },
]

/**
 * The reveal flags actually in effect, given how many guesses have been made.
 * Hints only ever *add* reveals on top of what the player configured; the
 * configured (base) settings are what gets shared, not these.
 */
export function effectiveReveal(base: QuizSettings, guessesMade: number): QuizSettings {
  if (!base.hints) return base
  return {
    ...base,
    type: base.type || guessesMade >= 2, // at guess 3
    ability: base.ability || guessesMade >= 3, // at guess 4
    height: base.height || guessesMade >= 4, // at guess 5
    weight: base.weight || guessesMade >= 4,
  }
}

/** Human-readable chips describing the *configured* settings (for the result screen). */
export function describeSettings(settings: QuizSettings): string[] {
  const out = [
    `Image: ${settings.image}`,
    `Base stats: ${settings.baseStats ? 'shown' : 'hidden'}`,
    `Cry: ${settings.cry ? 'on' : 'off'}`,
  ]
  for (const { key, label } of REVEAL_FIELDS) {
    out.push(`${label}: ${settings[key] ? 'shown' : 'hidden'}`)
  }
  out.push(`Hints: ${settings.hints ? 'on' : 'off'}`)
  return out
}
