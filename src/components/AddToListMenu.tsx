import { useEffect, useRef, useState } from 'react'
import { listsStore, useLists } from '../hooks/useLists'

type Props = {
  pokemonId: number
  /** `compact` is the small "＋" used on grid cards; `full` is a labelled button. */
  variant?: 'compact' | 'full'
}

export function AddToListMenu({ pokemonId, variant = 'compact' }: Props) {
  const lists = useLists()
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const memberCount = lists.filter((l) => l.pokemonIds.includes(pokemonId)).length

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

  const createAndAdd = () => {
    const name = draftName.trim()
    if (!name) return
    const list = listsStore.createList(name)
    listsStore.addToList(list.id, pokemonId)
    setDraftName('')
  }

  return (
    <div className="addlist" ref={rootRef}>
      <button
        type="button"
        className={variant === 'compact' ? 'addlist-trigger addlist-trigger--compact' : 'addlist-trigger addlist-trigger--full'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        title="Add to a list"
      >
        {variant === 'compact' ? (
          <span className={memberCount > 0 ? 'addlist-badge addlist-badge--on' : 'addlist-badge'}>
            {memberCount > 0 ? `✓${memberCount}` : '＋'}
          </span>
        ) : (
          <>＋ {memberCount > 0 ? `In ${memberCount} list${memberCount > 1 ? 's' : ''}` : 'Add to list'}</>
        )}
      </button>

      {open && (
        <div className="addlist-menu" role="menu" onClick={(e) => e.stopPropagation()}>
          {lists.length === 0 && <p className="hint-text addlist-empty">No lists yet — create one below.</p>}
          {lists.map((list) => {
            const checked = list.pokemonIds.includes(pokemonId)
            return (
              <label key={list.id} className="addlist-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => listsStore.toggleInList(list.id, pokemonId)}
                />
                <span className="addlist-item-name">{list.name}</span>
                <span className="addlist-item-count">{list.pokemonIds.length}</span>
              </label>
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
