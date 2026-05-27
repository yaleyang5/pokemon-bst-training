import { HINT_SCHEDULE, IMAGE_MODES, REVEAL_FIELDS, type QuizSettings as Settings } from '../util/quiz'

type Props = {
  settings: Settings
  onChange: (settings: Settings) => void
}

export function QuizSettings({ settings, onChange }: Props) {
  // At least one of base stats / cry must stay enabled, so each is locked while
  // it is the only one on.
  const baseStatsLocked = !settings.cry // can't turn base stats off unless cry covers it
  const cryLocked = settings.cry && !settings.baseStats // can't turn cry off if it's the only clue

  const setBaseStats = (value: boolean) => {
    if (!value && !settings.cry) return
    onChange({ ...settings, baseStats: value })
  }
  const setCry = (value: boolean) => {
    if (!value && !settings.baseStats) return
    onChange({ ...settings, cry: value })
  }

  return (
    <div className="quiz-settings">
      <div className="filter-group">
        <h3>Reveal</h3>
        <div className="setting-row">
          <span className="setting-label">Image</span>
          <div className="segmented">
            {IMAGE_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={`segmented-btn ${settings.image === mode.value ? 'segmented-btn--on' : ''}`}
                aria-pressed={settings.image === mode.value}
                onClick={() => onChange({ ...settings, image: mode.value })}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.baseStats}
            disabled={baseStatsLocked}
            onChange={(e) => setBaseStats(e.target.checked)}
          />
          <span>Show base stats</span>
        </label>

        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.cry}
            disabled={cryLocked}
            onChange={(e) => setCry(e.target.checked)}
          />
          <span>Show Pokémon cry</span>
        </label>

        {REVEAL_FIELDS.map(({ key, label }) => (
          <label key={key} className="switch-row">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => onChange({ ...settings, [key]: e.target.checked })}
            />
            <span>Show {label.toLowerCase()}</span>
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h3>Hints</h3>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.hints}
            onChange={(e) => onChange({ ...settings, hints: e.target.checked })}
          />
          <span>Reveal clues after wrong guesses</span>
        </label>
        {settings.hints && (
          <ul className="hint-schedule">
            {HINT_SCHEDULE.map((h) => (
              <li key={h.atGuess}>
                <span className="hint-when">Guess {h.atGuess}</span>
                {h.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
