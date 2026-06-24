import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MATCHA_CAFES, LA_CENTER, LA_DEFAULT_ZOOM } from '../constants/cafes.js'
import { fetchRoadNetwork } from '../utils/overpass.js'
import { buildGraph, findNearestNode } from '../utils/graph.js'
import { runDijkstra } from '../utils/dijkstra.js'
import { runAstar } from '../utils/astar.js'

const SPEED_DELAYS  = { slow: 80, medium: 18, fast: 4, ultrafast: 0 }
const SPEED_BATCHES = { slow: 1,  medium: 4,  fast: 15, ultrafast: 60 }

delete L.Icon.Default.prototype._getIconUrl

export default function MapView({
  algorithm, speed,
  onStatus, onStats, onPhase,
  pendingLocation, onLocationConsumed,
}) {
  const containerRef   = useRef(null)
  const mapRef         = useRef(null)
  const canvasRef      = useRef(null)
  const handlePointRef = useRef(null)

  // { start: {lng,lat}|null, end: {lng,lat}|null, startIsCafe, startIsGps }
  const selectionRef  = useRef({ start: null, end: null, startIsCafe: false, startIsGps: false })
  const animTimerRef  = useRef(null)
  const errorTimerRef = useRef(null)
  const abortRef      = useRef(null)
  const algorithmRef  = useRef(algorithm)
  const speedRef      = useRef(speed)

  const layersRef = useRef({ roadNetwork: null, exploration: null, path: null, start: null, end: null })

  useEffect(() => { algorithmRef.current = algorithm }, [algorithm])
  useEffect(() => { speedRef.current    = speed      }, [speed])

  // ── Consume pending GPS location ─────────────────────────────────────────
  useEffect(() => {
    if (!pendingLocation || !mapRef.current) return
    handlePointRef.current(pendingLocation, false, true)  // isCafe=false, isGps=true
    onLocationConsumed()
  }, [pendingLocation, onLocationConsumed])

  // ── Layer helpers ─────────────────────────────────────────────────────────
  const removeLayer = useCallback((key) => {
    const layer = layersRef.current[key]
    if (layer && mapRef.current) { mapRef.current.removeLayer(layer); layersRef.current[key] = null }
  }, [])

  const clearAnimation = useCallback(() => {
    if (animTimerRef.current)  { clearTimeout(animTimerRef.current);  animTimerRef.current  = null }
    if (abortRef.current)      { abortRef.current.abort();             abortRef.current      = null }
  }, [])

  const clearVisualization = useCallback(() => {
    clearAnimation()
    removeLayer('roadNetwork')
    removeLayer('exploration')
    removeLayer('path')
  }, [clearAnimation, removeLayer])

  // ── Point markers ─────────────────────────────────────────────────────────
  const placePointMarker = useCallback((lngLat, key, isGps = false) => {
    removeLayer(key)
    const extraClass = key === 'start' && isGps ? ' gps' : ''
    const icon = L.divIcon({
      html:       `<div class="point-marker ${key}${extraClass}"></div>`,
      className:  '',
      iconSize:   [18, 18],
      iconAnchor: [9, 9],
    })
    layersRef.current[key] = L.marker([lngLat.lat, lngLat.lng], { icon, zIndexOffset: 500 })
      .addTo(mapRef.current)
  }, [removeLayer])

  // ── Animation ─────────────────────────────────────────────────────────────
  const animateSteps = useCallback((visitSteps, path, pathLength, nodesVisited, startCoord, endCoord) => {
    const delay    = SPEED_DELAYS[speedRef.current]
    const batchSz  = SPEED_BATCHES[speedRef.current]
    const renderer = canvasRef.current
    const explorationGroup = L.layerGroup().addTo(mapRef.current)
    layersRef.current.exploration = explorationGroup
    let idx = 0

    const tick = () => {
      const end = Math.min(idx + batchSz, visitSteps.length)
      for (let i = idx; i < end; i++) {
        const [lng, lat] = visitSteps[i].coords
        L.circleMarker([lat, lng], {
          renderer, radius: 3, color: '#9DBF98', fillColor: '#9DBF98', fillOpacity: 0.65, weight: 0,
        }).addTo(explorationGroup)
      }
      idx = end
      onStats({ nodesVisited: idx, pathLength: null, phase: 'exploring' })

      if (idx < visitSteps.length) { animTimerRef.current = setTimeout(tick, delay); return }

      if (path) {
        // Anchor path exactly at the selected pin coordinates
        const inner = path.map(([lng, lat]) => [lat, lng])
        const latlngs = [
          [startCoord.lat, startCoord.lng],
          ...inner,
          [endCoord.lat, endCoord.lng],
        ]
        const pathGroup = L.layerGroup().addTo(mapRef.current)
        layersRef.current.path = pathGroup
        const paneOpts = { pane: 'pathPane' }
        L.polyline(latlngs, { ...paneOpts, color: '#6B9B65', weight: 13, opacity: 0.16, lineCap: 'round', lineJoin: 'round' }).addTo(pathGroup)
        L.polyline(latlngs, { ...paneOpts, color: '#4E7A4A', weight: 4.5, opacity: 1,   lineCap: 'round', lineJoin: 'round' }).addTo(pathGroup)
        onStats({ nodesVisited, pathLength, phase: 'done' })
        onStatus('done')
        onPhase('done')
      } else {
        onStatus('no-path')
        onPhase('idle')
        onStats({ nodesVisited, pathLength: null, phase: 'no-path' })
      }
    }

    tick()
  }, [onStats, onStatus, onPhase])

  // ── Route runner ──────────────────────────────────────────────────────────
  const runRoute = useCallback(async (start, end) => {
    clearVisualization()
    onStatus('loading')
    onPhase('loading')
    onStats(null)

    abortRef.current = new AbortController()
    let osmData
    try {
      osmData = await fetchRoadNetwork(start, end, abortRef.current.signal)
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error(err)
      onStatus('error')
      onPhase('idle')
      return
    }

    const graph = buildGraph(osmData)

    const roadGroup = L.layerGroup().addTo(mapRef.current)
    layersRef.current.roadNetwork = roadGroup
    graph.wayLines.forEach(f => {
      L.polyline(f.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        { color: '#C4BEAF', weight: 1, opacity: 0.55 }
      ).addTo(roadGroup)
    })

    const startId = findNearestNode(graph.nodes, start.lng, start.lat)
    const endId   = findNearestNode(graph.nodes, end.lng,   end.lat)
    if (!startId || !endId) { onStatus('no-path'); onPhase('idle'); return }

    onStatus('running')
    onPhase('running')

    const algo   = algorithmRef.current === 'astar' ? runAstar : runDijkstra
    const result = algo(graph, startId, endId)
    animateSteps(result.visitSteps, result.path, result.pathLength, result.nodesVisited, start, end)
  }, [clearVisualization, animateSteps, onStatus, onPhase, onStats])

  // ── Point selection + café constraint ────────────────────────────────────
  const handlePoint = useCallback((lngLat, isCafe = false, isGps = false) => {
    const sel = selectionRef.current

    const clearHighlights = () =>
      document.querySelectorAll('.cafe-marker-wrap.selected-start, .cafe-marker-wrap.selected-end')
        .forEach(el => el.classList.remove('selected-start', 'selected-end'))

    // Third click → reset, then treat this click as the new start
    if (sel.start && sel.end) {
      clearVisualization()
      removeLayer('start')
      removeLayer('end')
      clearHighlights()
      if (errorTimerRef.current) { clearTimeout(errorTimerRef.current); errorTimerRef.current = null }
      selectionRef.current = { start: lngLat, end: null, startIsCafe: isCafe, startIsGps: isGps }
      placePointMarker(lngLat, 'start', isGps)
      onStatus('start-set')
      onPhase('selecting')
      onStats(null)
      return
    }

    if (!sel.start) {
      selectionRef.current = { start: lngLat, end: null, startIsCafe: isCafe, startIsGps: isGps }
      placePointMarker(lngLat, 'start', isGps)
      onStatus('start-set')
      onPhase('selecting')
    } else {
      // Validate: at least one point must be a café
      if (!sel.startIsCafe && !isCafe) {
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        onStatus('not-a-cafe')
        errorTimerRef.current = setTimeout(() => onStatus('start-set'), 3000)
        return
      }
      selectionRef.current = { ...sel, end: lngLat }
      placePointMarker(lngLat, 'end', false)
      runRoute(sel.start, lngLat)
    }
  }, [clearVisualization, removeLayer, placePointMarker, runRoute, onStatus, onPhase, onStats])

  handlePointRef.current = handlePoint

  // ── Map initialisation (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [LA_CENTER.lat, LA_CENTER.lng],
      zoom:   LA_DEFAULT_ZOOM,
      zoomControl: false,
      zoomSnap: 0.5,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Dedicated pane above the canvas overlay (400) so the path line is never buried
    map.createPane('pathPane')
    map.getPane('pathPane').style.zIndex = 450

    canvasRef.current = L.canvas({ padding: 0.5 })

    // ── Matcha café markers ──
    MATCHA_CAFES.forEach(cafe => {
      const icon = L.divIcon({
        html: `<div class="cafe-marker-wrap" data-id="${cafe.id}">
                 <span class="cafe-emoji">🍵</span>
                 <span class="cafe-label">${cafe.name}</span>
               </div>`,
        className:  '',
        iconSize:   [32, 32],
        iconAnchor: [16, 28],
      })

      const marker = L.marker([cafe.lat, cafe.lng], { icon, zIndexOffset: 200 }).addTo(map)

      marker.on('click', e => {
        L.DomEvent.stopPropagation(e)
        document.querySelectorAll('.cafe-marker-wrap.selected-start, .cafe-marker-wrap.selected-end')
          .forEach(el => el.classList.remove('selected-start', 'selected-end'))
        const wrapEl = marker.getElement()?.querySelector('.cafe-marker-wrap')
        if (wrapEl) {
          const sel = selectionRef.current
          wrapEl.classList.add((!sel.start || (sel.start && sel.end)) ? 'selected-start' : 'selected-end')
        }
        handlePointRef.current({ lng: cafe.lng, lat: cafe.lat }, true)   // isCafe = true
      })
    })

    map.on('click', e => {
      document.querySelectorAll('.cafe-marker-wrap.selected-start, .cafe-marker-wrap.selected-end')
        .forEach(el => el.classList.remove('selected-start', 'selected-end'))
      handlePointRef.current({ lng: e.latlng.lng, lat: e.latlng.lat }, false)  // isCafe = false
    })

    mapRef.current = map
    return () => { clearAnimation(); map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
