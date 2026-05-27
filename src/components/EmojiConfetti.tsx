import { useMemo } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  /** Emoji to rain down — e.g. 🎉 for a win, 🥲 for a loss. */
  emoji: string
  count?: number
}

// Deterministic pseudo-random in [0,1) from a seed. Keeps render pure (no
// Math.random) while still scattering the pieces convincingly.
const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** A one-shot overlay of emoji falling across the screen. Purely decorative. */
export function EmojiConfetti({ emoji, count = 32 }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: rand(i + 1) * 100,
        delay: rand(i + 101) * 0.7,
        duration: 2.8 + rand(i + 201) * 2,
        size: 16 + rand(i + 301) * 22,
        drift: (rand(i + 401) - 0.5) * 120,
        spin: rand(i + 501) < 0.5 ? -360 : 360,
      })),
    [count],
  )

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}
