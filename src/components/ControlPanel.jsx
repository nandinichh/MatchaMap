const ALGORITHMS = [
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    desc: 'Explores all nodes uniformly by distance. Always finds the optimal path.',
  },
  {
    id: 'astar',
    name: 'A* Search',
    desc: 'Heuristic-guided toward the goal. Visits fewer nodes, same optimal result.',
  },
]

const SPEEDS = [
  { id: 'slow', label: 'Slow' },
  { id: 'medium', label: 'Medium' },
  { id: 'fast', label: 'Fast' },
  { id: 'ultrafast', label: 'Instant' },
]

export default function ControlPanel({
  algorithm, speed, onAlgorithm, onSpeed, phase, onLocate,
}) {
  return (
    <div className="control-panel">
      <div className="panel-header">
        <span className="panel-tea">🍵</span>
        <div>
          <h1 className="panel-title">MatchaMap</h1>
          <p className="panel-subtitle">LA Pathfinding</p>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-label">Algorithm</div>
        <div className="algo-options">
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              className={`algo-btn ${algorithm === a.id ? 'active' : ''}`}
              onClick={() => onAlgorithm(a.id)}
              disabled={phase === 'loading' || phase === 'running'}
            >
              <div className="algo-name">{a.name}</div>
              <div className="algo-desc">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-label">Animation Speed</div>
        <div className="speed-row">
          {SPEEDS.map(s => (
            <button
              key={s.id}
              className={`speed-btn ${speed === s.id ? 'active' : ''}`}
              onClick={() => onSpeed(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <button
          className="locate-btn"
          onClick={onLocate}
          disabled={phase === 'loading' || phase === 'running'}
        >
          <span className="locate-icon">🎓</span>
          USC Village
        </button>
      </div>

      <div className="panel-section instructions">
        <div className="section-label">How to use</div>
        <div className="instruction-steps">
          <div className="step">
            <span className="step-dot start-dot" />
            <span>Click a 🍵 café or anywhere on the map to set your <strong>start</strong></span>
          </div>
          <div className="step">
            <span className="step-dot end-dot" />
            <span>Click again to set your <strong>destination</strong></span>
          </div>
          <div className="step">
            <span className="step-icon">🍵</span>
            <span>At least one point must be a matcha café</span>
          </div>
          <div className="step">
            <span className="step-icon">↺</span>
            <span>Click a third time anywhere to reset</span>
          </div>
        </div>
      </div>
    </div>
  )
}
