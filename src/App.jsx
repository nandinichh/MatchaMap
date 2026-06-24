import { useState, useCallback } from 'react'
import MapView from './components/MapView.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import './App.css'

const USC_VILLAGE = { lat: 34.0259, lng: -118.2853 }

export default function App() {
  const [algorithm, setAlgorithm] = useState('dijkstra')
  const [speed, setSpeed] = useState('medium')
  const [status, setStatus] = useState('idle')
  const [stats, setStats] = useState(null)
  const [phase, setPhase] = useState('idle')

  const [pendingLocation, setPendingLocation] = useState(null)

  const handleStatus = useCallback(s => setStatus(s), [])
  const handleStats = useCallback(s => setStats(s), [])
  const handlePhase = useCallback(p => setPhase(p), [])
  const handleLocationConsumed = useCallback(() => setPendingLocation(null), [])

  const handleLocate = useCallback(() => setPendingLocation(USC_VILLAGE), [])

  return (
    <div className="app-root">
      <MapView
        algorithm={algorithm}
        speed={speed}
        onStatus={handleStatus}
        onStats={handleStats}
        onPhase={handlePhase}
        pendingLocation={pendingLocation}
        onLocationConsumed={handleLocationConsumed}
      />

      <div className="overlay-left">
        <ControlPanel
          algorithm={algorithm}
          speed={speed}
          onAlgorithm={setAlgorithm}
          onSpeed={setSpeed}
          phase={phase}
          onLocate={handleLocate}
        />
      </div>

      <div className="overlay-right">
        <StatsPanel
          status={status}
          stats={stats}
          algorithm={algorithm}
          phase={phase}
        />
      </div>
    </div>
  )
}
