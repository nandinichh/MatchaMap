const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const ROAD_TYPES = [
  'motorway', 'motorway_link',
  'trunk', 'trunk_link',
  'primary', 'primary_link',
  'secondary', 'secondary_link',
  'tertiary', 'tertiary_link',
  'residential',
  'unclassified',
  'living_street',
].join('|')

function getBoundingBox(p1, p2) {
  const south = Math.min(p1.lat, p2.lat)
  const north = Math.max(p1.lat, p2.lat)
  const west  = Math.min(p1.lng, p2.lng)
  const east  = Math.max(p1.lng, p2.lng)

  // 20% padding on each side, minimum 0.01° (~1 km) so nearby points get enough context
  const latPad = Math.max((north - south) * 0.20, 0.01)
  const lngPad = Math.max((east  - west)  * 0.20, 0.01)

  return {
    south: south - latPad,
    north: north + latPad,
    west:  west  - lngPad,
    east:  east  + lngPad,
  }
}

export async function fetchRoadNetwork(point1, point2, signal) {
  const bbox = getBoundingBox(point1, point2)
  const { south, west, north, east } = bbox

  const query = `[out:json][timeout:90];
(
  way["highway"~"^(${ROAD_TYPES})$"]
  (${south},${west},${north},${east});
);
out geom;`

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  })

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`)

  const data = await res.json()
  return data
}
