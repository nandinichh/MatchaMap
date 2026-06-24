export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function buildGraph(osmData) {
  const nodes = {}
  const edges = {}
  const wayLines = []

  osmData.elements.forEach(el => {
    if (el.type !== 'way') return
    // out geom embeds coordinates directly in each way's geometry array
    const geom = el.geometry
    if (!geom || geom.length < 2) return

    const tags = el.tags || {}
    const isOneWay =
      tags.oneway === 'yes' ||
      tags.oneway === '1' ||
      tags.highway === 'motorway' ||
      tags.highway === 'motorway_link'
    const isReversed = tags.oneway === '-1'

    const nodeIds = el.nodes.map(String)

    // Register every geometry point as a graph node
    geom.forEach((pt, i) => {
      if (!pt || pt.lat == null) return
      const id = nodeIds[i]
      if (!id || nodes[id]) return
      nodes[id] = { id, lat: pt.lat, lng: pt.lon }
      edges[id] = []
    })

    // Build edges between consecutive nodes and collect way coords
    const coords = []
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const fromId = nodeIds[i]
      const toId   = nodeIds[i + 1]
      const fromPt = geom[i]
      const toPt   = geom[i + 1]

      if (!fromPt || !toPt || !nodes[fromId] || !nodes[toId]) continue

      const dist = haversine(fromPt.lat, fromPt.lon, toPt.lat, toPt.lon)

      if (!isReversed)            edges[fromId].push({ to: toId, weight: dist })
      if (!isOneWay || isReversed) edges[toId].push({ to: fromId, weight: dist })

      if (i === 0) coords.push([fromPt.lon, fromPt.lat])
      coords.push([toPt.lon, toPt.lat])
    }

    if (coords.length >= 2) {
      wayLines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} })
    }
  })

  return { nodes, edges, wayLines }
}

export function findNearestNode(nodes, lng, lat) {
  let nearestId = null
  let minDist = Infinity

  for (const [id, node] of Object.entries(nodes)) {
    const d = haversine(lat, lng, node.lat, node.lng)
    if (d < minDist) {
      minDist = d
      nearestId = id
    }
  }

  return nearestId
}

export class PriorityQueue {
  constructor() {
    this._heap = []
  }

  get size() {
    return this._heap.length
  }

  enqueue(item, priority) {
    this._heap.push({ item, priority })
    this._bubbleUp(this._heap.length - 1)
  }

  dequeue() {
    const top = this._heap[0]
    const last = this._heap.pop()
    if (this._heap.length > 0) {
      this._heap[0] = last
      this._sinkDown(0)
    }
    return top
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this._heap[parent].priority <= this._heap[i].priority) break
      ;[this._heap[parent], this._heap[i]] = [this._heap[i], this._heap[parent]]
      i = parent
    }
  }

  _sinkDown(i) {
    const n = this._heap.length
    while (true) {
      let min = i
      const l = 2 * i + 1
      const r = 2 * i + 2
      if (l < n && this._heap[l].priority < this._heap[min].priority) min = l
      if (r < n && this._heap[r].priority < this._heap[min].priority) min = r
      if (min === i) break
      ;[this._heap[min], this._heap[i]] = [this._heap[i], this._heap[min]]
      i = min
    }
  }
}
