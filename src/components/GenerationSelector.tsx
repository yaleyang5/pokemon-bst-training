import { GENERATIONS } from '../constants/pokemon'

type Props = {
  selected: number[]
  onChange: (gens: number[]) => void
}

const ALL_GENS = GENERATIONS.map((g) => g.gen)

export function GenerationSelector({ selected, onChange }: Props) {
  const toggle = (gen: number) => {
    onChange(selected.includes(gen) ? selected.filter((g) => g !== gen) : [...selected, gen])
  }

  const allSelected = ALL_GENS.every((g) => selected.includes(g))

  return (
    <div className="gen-selector">
      <div className="gen-chips">
        {GENERATIONS.map((g) => {
          const active = selected.includes(g.gen)
          return (
            <button
              key={g.gen}
              type="button"
              className={`chip ${active ? 'chip--on' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(g.gen)}
              title={g.region}
            >
              Gen {g.gen}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="link-btn"
        onClick={() => onChange(allSelected ? [] : ALL_GENS)}
      >
        {allSelected ? 'Clear all' : 'Select all'}
      </button>
    </div>
  )
}
