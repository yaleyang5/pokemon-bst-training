import { MAX_STAT, STAT_KEYS, STAT_LABELS, type StatKey } from '../constants/pokemon'

type Props = {
  stats: Record<StatKey, number>
  bst: number
  /** Optionally emphasise the stat currently being sorted on. */
  highlight?: StatKey | 'bst' | null
}

export function StatBars({ stats, bst, highlight = null }: Props) {
  return (
    <dl className="stats">
      {STAT_KEYS.map((key) => (
        <div key={key} className={`stat-row ${highlight === key ? 'stat-row--hl' : ''}`}>
          <dt>{STAT_LABELS[key]}</dt>
          <dd>
            <div className="stat-bar" style={{ width: `${(stats[key] / MAX_STAT) * 100}%` }} />
            <span>{stats[key]}</span>
          </dd>
        </div>
      ))}
      <div className={`stat-row stat-row--bst ${highlight === 'bst' ? 'stat-row--hl' : ''}`}>
        <dt>BST</dt>
        <dd>
          <span>{bst}</span>
        </dd>
      </div>
    </dl>
  )
}
