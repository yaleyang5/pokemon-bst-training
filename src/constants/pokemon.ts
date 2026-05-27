// Domain constants for the Pokémon base-stat-total trainer.

/** The six base stats, in the canonical order the games display them. */
export const STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const

export type StatKey = (typeof STAT_KEYS)[number]

/** Maps PokéAPI stat names onto our camelCase keys. */
export const API_STAT_TO_KEY: Record<string, StatKey> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'spAttack',
  'special-defense': 'spDefense',
  speed: 'speed',
}

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  spAttack: 'Sp. Atk',
  spDefense: 'Sp. Def',
  speed: 'Speed',
}

export type Generation = {
  gen: number
  region: string
  /** Inclusive national-dex id range for the generation's base forms. */
  start: number
  end: number
}

/**
 * National-dex id ranges per generation. PokéAPI currently exposes ids 1–1025
 * (through generation IX). A future "gen 10" can be added here and the rest of
 * the app will pick it up automatically — until the API serves those ids,
 * fetches simply 404 and the generation stays empty.
 */
export const GENERATIONS: Generation[] = [
  { gen: 1, region: 'Kanto', start: 1, end: 151 },
  { gen: 2, region: 'Johto', start: 152, end: 251 },
  { gen: 3, region: 'Hoenn', start: 252, end: 386 },
  { gen: 4, region: 'Sinnoh', start: 387, end: 493 },
  { gen: 5, region: 'Unova', start: 494, end: 649 },
  { gen: 6, region: 'Kalos', start: 650, end: 721 },
  { gen: 7, region: 'Alola', start: 722, end: 809 },
  { gen: 8, region: 'Galar', start: 810, end: 905 },
  { gen: 9, region: 'Paldea', start: 906, end: 1025 },
]

export const GENERATION_BY_NUMBER: Record<number, Generation> = Object.fromEntries(
  GENERATIONS.map((g) => [g.gen, g]),
)

/** Which generation a national-dex id belongs to (0 if out of range). */
export function generationForId(id: number): number {
  const match = GENERATIONS.find((g) => id >= g.start && id <= g.end)
  return match ? match.gen : 0
}

/** The 18 Pokémon types. */
export const ALL_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

/** A single stat maxes out at 255; the full BST tops out around 720 (Eternamax aside). */
export const MAX_STAT = 255
export const MAX_BST = 780
