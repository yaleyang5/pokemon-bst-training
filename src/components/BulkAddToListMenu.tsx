import { useEffect, useRef, useState } from 'react'
import { listsStore, useLists } from '../hooks/useLists'

type Props = {
  /** Currently-selected Pokémon ids to add in bulk. */
  pokemonIds: number[]
  /** Called after a successful add (e.g. to clear the selection). */
  onAdded?: () => void
}

export function BulkAddToListMenu({ pokemonIds, onAdded }: Props) {
  const lists = useLists()
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [added, setAdded] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const disabled = pokemonIds.length === 0

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const addAllTo = (listId: string, listName: string) => {
    pokemonIds.forEach((id) => listsStore.addToList(listId, id))
    setAdded(`Added ${pokemonIds.length} to ${listName}`)
    setOpen(false)
    onAdded?.()
    setTimeout(() => setAdded(null), 2200)
  }

  const createAndAdd = () => {
    const name = draftName.trim()
    if (!name) return
    const list = listsStore.createList(name)
    setDraftName('')
    addAllTo(list.id, list.name)
  }

  return (
    <div className="addlist" ref={rootRef}>
      <button
        type="button"
        className="bulk-add-trigger"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {added ?? `Add ${pokemonIds.length} to list ▾`}
      </button>

      {open && !disabled && (
        <div className="addlist-menu" role="menu">
          {lists.length === 0 && <p className="hint-text addlist-empty">No lists yet — create one below.</p>}
          {lists.map((list) => {
            const already = pokemonIds.filter((id) => list.pokemonIds.includes(id)).length
            return (
              <button
                key={list.id}
                type="button"
                className="addlist-item addlist-item--btn"
                onClick={() => addAllTo(list.id, list.name)}
              >
                <span className="addlist-item-name">{list.name}</span>
                <span className="addlist-item-count">
                  {already > 0 ? `${already}/${pokemonIds.length} in` : list.pokemonIds.length}
                </span>
              </button>
            )
          })}
          <div className="addlist-new">
            <input
              type="text"
              placeholder="New list name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
            />
            <button type="button" onClick={createAndAdd} disabled={!draftName.trim()}>
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
