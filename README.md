# 🍵 MatchaMap

An interactive pathfinding visualizer set across Los Angeles, where at least one stop must be a matcha café. Pick two points on the map and watch Dijkstra's or A* explore the real LA road network to find the shortest path between them.

Live demo: [nandinichh.github.io/MatchaMap](https://nandinichh.github.io/MatchaMap)

---

## What it does

- Fetches the actual LA road network from the [OpenStreetMap Overpass API](https://overpass-api.de/) for any two selected points
- Runs your chosen algorithm on that graph and animates the exploration step by step
- Draws the optimal path once the search completes, along with stats (nodes visited, path length)
- Enforces a rule: **at least one of your two points must be a matcha café** — 35 real LA spots are pre-pinned on the map
- USC Village is available as a quick-select button for a convenient non-café anchor point

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 18 + Vite |
| Map rendering | [Leaflet](https://leafletjs.com/) with CARTO light tiles |
| Road data | OpenStreetMap via the Overpass API |
| Algorithms | Custom Dijkstra and A* (haversine heuristic) |
| Deployment | GitHub Pages via `gh-pages` |

No map token required — tiles are served by CARTO and road data is fetched from the public Overpass API.

## Key features

- **Two algorithms**: Dijkstra (uniform-cost, always optimal) and A* (heuristic-guided, visits fewer nodes for the same result). Switch between them before starting a route.
- **Animated exploration**: Watch the frontier expand node by node at four selectable speeds (Slow / Medium / Fast / Instant).
- **Live stats**: Node count and path length update in real time during and after the search.
- **Real road graph**: Each route fetches the actual street network for the bounding box between your two points — no pre-baked graph.
- **Café constraint**: At least one endpoint must be one of the 35 pinned matcha cafés, spanning West Hollywood, Silver Lake, Koreatown, Pasadena, the Arts District, and more.

## Setup

```bash
git clone https://github.com/nandinichh/MatchaMap.git
cd MatchaMap
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How to use

1. Click a 🍵 café marker (or anywhere on the map) to set your **start**
2. Click again to set your **destination** — at least one point must be a café
3. The road network loads, the algorithm runs, and the path animates
4. Click a third time anywhere to reset and start over
5. Use the **USC Village** button as a quick non-café anchor point

## Deployment

```bash
npm run deploy
```

Builds to `dist/` and pushes to the `gh-pages` branch via the `gh-pages` package.
