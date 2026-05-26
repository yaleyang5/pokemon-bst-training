import { useState } from 'react'
import { PokemonList } from './components/PokemonList'
import { PokemonDetail } from './components/PokemonDetail'
import { FavoritesPanel } from './components/FavoritesPanel'
import './App.css'

function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>React Query Showcase</h1>
        <p className="subtitle">
          PokéAPI for queries · localStorage for mutations · DevTools panel bottom-right
        </p>
      </header>

      <main className="app-main">
        <section className="panel">
          <h2>Pokédex</h2>
          <PokemonList selectedId={selectedId} onSelect={setSelectedId} />
        </section>

        <aside className="panel">
          <h2>{selectedId ? 'Details' : 'Favorites'}</h2>
          {selectedId ? (
            <PokemonDetail id={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <FavoritesPanel onSelect={setSelectedId} />
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
