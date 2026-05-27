import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { NameOption } from '../api/pokemon'

type Props = {
  /** Selectable Pokémon — the guess pool minus names already guessed. */
  options: NameOption[]
  onSelect: (pokemon: NameOption) => void
  disabled?: boolean
  /** Hide option sprites (e.g. when the mystery image is shown/blurred, so you
   *  can't just visually match it against the list). */
  showSprites?: boolean
}

export function NameComboBox({ options, onSelect, disabled = false, showSprites = true }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  // Show every matching option — the list is scrollable, so no cap.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((p) => p.name.toLowerCase().includes(q)) : options
  }, [options, query])

  // Clamp during render so the highlight stays valid as matches shrink/grow,
  // without an effect that re-renders.
  const activeIndex = matches.length === 0 ? 0 : Math.min(highlight, matches.length - 1)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const choose = (pokemon: NameOption | undefined) => {
    if (!pokemon) return
    onSelect(pokemon)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight(Math.min(activeIndex + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(matches[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="combobox" ref={rootRef}>
      <input
        type="text"
        className="combobox-input"
        placeholder={disabled ? 'No Pokémon left to guess' : 'Type or pick a Pokémon…'}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls="combobox-list"
        autoComplete="off"
      />
      {open && !disabled && matches.length > 0 && (
        <ul className="combobox-list" id="combobox-list" role="listbox">
          {matches.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                className={`combobox-option ${i === activeIndex ? 'combobox-option--hl' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(p)}
              >
                {showSprites && <img src={p.sprite} alt="" loading="lazy" />}
                <span className="combobox-name">{p.name}</span>
                <span className="pokemon-id">#{String(p.id).padStart(4, '0')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !disabled && matches.length === 0 && (
        <ul className="combobox-list" role="listbox">
          <li className="combobox-empty">No matches</li>
        </ul>
      )}
    </div>
  )
}
