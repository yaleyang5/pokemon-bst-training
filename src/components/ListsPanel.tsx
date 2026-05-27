import { useState } from 'react'
import type { PokemonSummary } from '../api/pokemon'
import { listsStore, useLists } from '../hooks/useLists'

type Props = {
  /** Loaded summaries keyed by id, for showing member names/stats. */
  lookup: Map<number, PokemonSummary>
  onSelect: (id: number) => void
}

const cdnSprite = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

export function ListsPanel({ lookup, onSelect }: Props) {
  const lists = useLists()
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const create = () => {
    const name = draft.trim()
    if (!name) return
    const list = listsStore.createList(name)
    setDraft('')
    setExpanded(list.id)
  }

  return (
    <div className="lists-panel">
      <div className="lists-new">
        <input
          type="text"
          placeholder="New list name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button type="button" onClick={create} disabled={!draft.trim()}>
          Create
        </button>
      </div>

      {lists.length === 0 && (
        <p className="hint-text">
          No lists yet. Create one above, or use the ＋ on any Pokémon to start a new list.
        </p>
      )}

      <ul className="lists">
        {lists.map((list) => {
          const isOpen = expanded === list.id
          return (
            <li key={list.id} className="list-card">
              <div className="list-card-head">
                {editing === list.id ? (
                  <input
                    type="text"
                    className="list-rename"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      listsStore.renameList(list.id, editName)
                      setEditing(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        listsStore.renameList(list.id, editName)
                        setEditing(null)
                      }
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="list-title"
                    onClick={() => setExpanded(isOpen ? null : list.id)}
                  >
                    <span className="list-caret">{isOpen ? '▾' : '▸'}</span>
                    {list.name}
                    <span className="list-count">{list.pokemonIds.length}</span>
                  </button>
                )}
                <div className="list-card-tools">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Rename"
                    onClick={() => {
                      setEditing(list.id)
                      setEditName(list.name)
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title="Delete list"
                    onClick={() => {
                      if (confirm(`Delete list "${list.name}"?`)) listsStore.deleteList(list.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="list-members">
                  {list.pokemonIds.length === 0 && (
                    <p className="hint-text">Empty — add Pokémon with the ＋ button.</p>
                  )}
                  {list.pokemonIds.map((id) => {
                    const p = lookup.get(id)
                    return (
                      <div key={id} className="member" title={p?.name ?? `#${id}`}>
                        <button type="button" className="member-main" onClick={() => onSelect(id)}>
                          <img src={p?.sprite ?? cdnSprite(id)} alt={p?.name ?? `#${id}`} />
                          <span className="member-name">{p?.name ?? `#${id}`}</span>
                          {p && <span className="member-bst">{p.bst}</span>}
                        </button>
                        <button
                          type="button"
                          className="member-remove"
                          aria-label="Remove from list"
                          onClick={() => listsStore.removeFromList(list.id, id)}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
