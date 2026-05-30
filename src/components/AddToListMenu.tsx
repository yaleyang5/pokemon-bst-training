import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const memberCount = lists.filter((l) => l.pokemonIds.includes(pokemonId)).length

  // Position the menu as a fixed popover, clamped to the viewport so cards near
  // an edge don't push it off-screen. Done imperatively (a DOM sync) and kept in
  // step with scroll/resize while open. It renders hidden until placed.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return
      const t = trigger.getBoundingClientRect()
      const m = menu.getBoundingClientRect()
      const margin = 8
      // Align the menu's right edge with the trigger, then clamp horizontally.
      const maxLeft = window.innerWidth - m.width - margin
      const left = Math.max(margin, Math.min(t.right - m.width, maxLeft))
      // Below the trigger, flipping above if it would run off the bottom.
      let top = t.bottom + 6
      if (top + m.height > window.innerHeight - margin) {
        const above = t.top - m.height - 6
        top = above >= margin ? above : Math.max(margin, window.innerHeight - m.height - margin)
      }
      menu.style.top = `${top}px`
      menu.style.left = `${left}px`
      menu.style.visibility = 'visible'
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, lists.length])

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
        ref={triggerRef}
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
        <div
          ref={menuRef}
          className="addlist-menu"
          role="menu"
          style={{ visibility: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
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
