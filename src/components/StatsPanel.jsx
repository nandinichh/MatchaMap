const ALGO_NAMES = {
  dijkstra: "Dijkstra's Algorithm",
  astar: 'A* Search',
}

const STATUS_MESSAGES = {
  idle: { emoji: '🍵', text: 'Select two points on the map to begin.' },
  'start-set': { emoji: '🌿', text: 'Now select your destination.' },
  loading: { emoji: '⏳', text: 'Fetching LA road network…' },
  running: { emoji: '✦', text: 'Exploring the graph…' },
  done: { emoji: '✓', text: 'Optimal path found.' },
  'no-path': { emoji: '—', text: 'No path found between these points.' },
  'not-a-cafe': { emoji: '🍵', text: 'At least one stop must be a matcha café 🍵' },
  error: { emoji: '!', text: 'Could not load road data. Please try again.' },
}

function formatDistance(meters) {
  if (meters == null || !isFinite(meters)) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

function formatCount(n) {
  if (n == null) return '—'
  return n.toLocaleString()
}

export default function StatsPanel({ status, stats, algorithm, phase }) {
  const msg = STATUS_MESSAGES[status] || STATUS_MESSAGES.idle
  const algoName = ALGO_NAMES[algorithm]
  const isActive = phase === 'loading' || phase === 'running'

  return (
    <div className="stats-panel">
      {/* Status */}
      <div className={`status-row ${isActive ? 'pulsing' : ''}`}>
        <span className="status-emoji">{msg.emoji}</span>
        <span className="status-text">{msg.text}</span>
      </div>

      {/* Divider */}
      <div className="stats-divider" />

      {/* Algo badge */}
      <div className="algo-badge">
        <span className="badge-dot" />
        <span className="badge-text">{algoName}</span>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-value">
            {formatCount(stats?.nodesVisited)}
          </div>
          <div className="metric-label">Nodes Visited</div>
        </div>
        <div className="metric-sep" />
        <div className="metric">
          <div className="metric-value">
            {stats?.phase === 'done' ? formatDistance(stats?.pathLength) : '—'}
          </div>
          <div className="metric-label">Path Length</div>
        </div>
      </div>

      {/* Progress bar */}
      {phase === 'running' && (
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" />
        </div>
      )}
    </div>
  )
}
