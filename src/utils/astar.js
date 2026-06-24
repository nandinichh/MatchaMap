import { PriorityQueue, haversine } from './graph.js'

export function runAstar(graph, startId, endId) {
  const { nodes, edges } = graph
  const gScore = {}
  const prev = {}
  const visited = new Set()
  const visitSteps = []

  const target = nodes[endId]
  const h = id => {
    const n = nodes[id]
    return haversine(n.lat, n.lng, target.lat, target.lng)
  }

  for (const id of Object.keys(nodes)) {
    gScore[id] = Infinity
  }
  gScore[startId] = 0

  const pq = new PriorityQueue()
  pq.enqueue(startId, h(startId))

  while (pq.size > 0) {
    const { item: current } = pq.dequeue()
    if (visited.has(current)) continue
    visited.add(current)

    const node = nodes[current]
    visitSteps.push({ nodeId: current, coords: [node.lng, node.lat] })

    if (current === endId) break

    for (const { to, weight } of edges[current] || []) {
      if (visited.has(to)) continue
      const tentG = gScore[current] + weight
      if (tentG < gScore[to]) {
        prev[to] = current
        gScore[to] = tentG
        pq.enqueue(to, tentG + h(to))
      }
    }
  }

  const path = reconstructPath(prev, nodes, startId, endId)
  const pathLength = gScore[endId]

  return {
    visitSteps,
    path,
    pathLength: isFinite(pathLength) ? pathLength : null,
    nodesVisited: visited.size,
  }
}

function reconstructPath(prev, nodes, startId, endId) {
  const path = []
  let curr = endId
  while (curr !== undefined) {
    const node = nodes[curr]
    if (!node) break
    path.unshift([node.lng, node.lat])
    if (curr === startId) break
    curr = prev[curr]
  }
  return path.length > 1 ? path : null
}
