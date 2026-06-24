import { PriorityQueue } from './graph.js'

export function runDijkstra(graph, startId, endId) {
  const { nodes, edges } = graph
  const dist = {}
  const prev = {}
  const visited = new Set()
  const visitSteps = []

  for (const id of Object.keys(nodes)) {
    dist[id] = Infinity
  }
  dist[startId] = 0

  const pq = new PriorityQueue()
  pq.enqueue(startId, 0)

  while (pq.size > 0) {
    const { item: current } = pq.dequeue()
    if (visited.has(current)) continue
    visited.add(current)

    const node = nodes[current]
    visitSteps.push({ nodeId: current, coords: [node.lng, node.lat] })

    if (current === endId) break

    for (const { to, weight } of edges[current] || []) {
      if (visited.has(to)) continue
      const newDist = dist[current] + weight
      if (newDist < dist[to]) {
        dist[to] = newDist
        prev[to] = current
        pq.enqueue(to, newDist)
      }
    }
  }

  const path = reconstructPath(prev, nodes, startId, endId)
  const pathLength = dist[endId]

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
