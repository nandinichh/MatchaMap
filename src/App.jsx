import { useState, useCallback } from 'react'
import MapView from './components/MapView.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import './App.css'

export default function App() {
  const [algorithm, setAlgorithm] = useState('dijkstra')
  const [speed, setSpeed] = useState('medium')
  const [status, setStatus] = useState('idle')
  const [stats, setStats] = useState(null)
  const [phase, setPhase] = useState('idle')

  // GPS state
  const [pendingLocation, setPendingLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState(null)

  const handleStatus = useCallback(s => setStatus(s), [])
  const handleStats = useCallback(s => setStats(s), [])
  const handlePhase = useCallback(p => setPhase(p), [])
  const handleLocationConsumed = useCallback(() => setPendingLocation(null), [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation not supported.')
      setTimeout(() => setLocateError(null), 3000)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPendingLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude })
        setLocating(false)
      },
      err => {
        setLocating(false)
        setLocateError(err.code === 1 ? 'Location access denied.' : 'Could not get location.')
        setTimeout(() => setLocateError(null), 3000)
      },
      { timeout: 10000 }
    )
  }, [])

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
          locating={locating}
          locateError={locateError}
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
