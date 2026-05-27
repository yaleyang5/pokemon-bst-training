import { useState } from 'react'
import { BrowseMode } from './components/BrowseMode'
import { QuizMode } from './components/QuizMode'
import './App.css'

type Mode = 'browse' | 'quiz'

function App() {
  // A shared challenge link should open straight into the quiz.
  const [mode, setMode] = useState<Mode>(() =>
    window.location.hash.includes('challenge=') ? 'quiz' : 'browse',
  )

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Pokémon Base Stat Quiz</h1>
          <p className="subtitle">
            Learn Pokémon base stats and quiz yourself by their stat spread · data from PokéAPI
          </p>
        </div>
        <nav className="mode-tabs" role="tablist" aria-label="Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'browse'}
            className={`mode-tab ${mode === 'browse' ? 'mode-tab--on' : ''}`}
            onClick={() => setMode('browse')}
          >
            Browse &amp; Lists
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quiz'}
            className={`mode-tab ${mode === 'quiz' ? 'mode-tab--on' : ''}`}
            onClick={() => setMode('quiz')}
          >
            Quiz
          </button>
        </nav>
      </header>

      <main>{mode === 'browse' ? <BrowseMode /> : <QuizMode />}</main>
    </div>
  )
}

export default App
