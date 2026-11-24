// PROTOTYPE: in-memory fake Library + Ride History. Deterministic (seeded), no personal data.

export type LngLat = [number, number]

export interface GpxFile {
  id: string
  name: string
  fileName: string
  folder: string // '' = Library root
  distanceKm: number
  elevationGainM: number
  source: string
  dateAdded: string // ISO date
  multiRoute: boolean
  identicalGroup?: string
  similarGroup?: string
  coords: LngLat[]
}

export interface Activity {
  id: string
  name: string
  type: 'Ride' | 'GravelRide' | 'Run' | 'Hike' | 'Walk'
  date: string
  distanceKm: number
  stravaId: number
  coords: LngLat[]
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(42)

function haversineKm(a: LngLat, b: LngLat) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function lengthKm(coords: LngLat[]) {
  let d = 0
  for (let i = 1; i < coords.length; i++) d += haversineKm(coords[i - 1], coords[i])
  return d
}

function bearing(a: LngLat, b: LngLat) {
  return Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1])
}

function step(p: LngLat, h: number, km: number): LngLat {
  return [p[0] + (km / (111 * Math.cos((p[1] * Math.PI) / 180))) * Math.sin(h), p[1] + (km / 111) * Math.cos(h)]
}

/** Random walk; when `loop`, turns steadily (roughly a lumpy circle) and closes back at the start. */
function walk(start: LngLat, steps: number, stepKm: number, heading: number, loop: boolean, wiggle = 0.5): LngLat[] {
  const pts: LngLat[] = [start]
  let p = start
  let h = heading
  const turn = ((rng() < 0.5 ? 1 : -1) * 2 * Math.PI) / steps
  for (let i = 0; i < steps; i++) {
    h += (rng() - 0.5) * wiggle + (loop ? turn * (0.6 + rng() * 0.8) : 0)
    if (loop && i > steps * 0.8) {
      let diff = bearing(p, start) - h
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      h += diff * 0.5
    }
    p = step(p, h, stepKm)
    pts.push(p)
  }
  if (loop) pts.push(start)
  return pts
}

function jitter(coords: LngLat[], metres: number): LngLat[] {
  const d = metres / 111000
  return coords.map(([x, y]) => [x + (rng() - 0.5) * d, y + (rng() - 0.5) * d])
}

const KRAKOW: LngLat = [19.937, 50.054]
// Shared corridor along the river: every "Kraków okolice" Route starts here, so they overlap.
const corridor = walk(KRAKOW, 14, 0.45, -Math.PI / 2 - 0.15, false, 0.15)
const corridorEnd = corridor[corridor.length - 1]

const SOURCES = ['Strava', 'Komoot', 'RideWithGPS', 'VeloPlanner', 'Garmin Connect', 'Mapy.com', 'gpx.studio', 'COROS']

interface Spec {
  name: string
  folder: string
  start?: LngLat
  viaCorridor?: boolean
  steps: number
  stepKm?: number
  heading: number
  loop?: boolean
  climb: number // m per km
  source?: string
  multiRoute?: boolean
}

const specs: Spec[] = [
  { name: 'Tyniec i powrót wałami', folder: 'Kraków okolice', viaCorridor: true, steps: 40, heading: -2.0, loop: true, climb: 4 },
  { name: 'Skawina pętla', folder: 'Kraków okolice', viaCorridor: true, steps: 60, heading: -2.6, loop: true, climb: 6 },
  { name: 'Dolinki Krakowskie', folder: 'Kraków okolice', viaCorridor: true, steps: 70, heading: -0.8, loop: true, climb: 11 },
  { name: 'Czernichów prom', folder: 'Kraków okolice', viaCorridor: true, steps: 55, heading: -1.8, loop: true, climb: 5 },
  { name: 'Wieczorna 40', folder: 'Kraków okolice', viaCorridor: true, steps: 45, heading: -1.2, loop: true, climb: 7 },
  { name: 'Puszcza Niepołomicka', folder: 'Kraków okolice', start: [20.02, 50.06], steps: 70, heading: 1.6, loop: true, climb: 3 },
  { name: 'Las Wolski szutry', folder: 'Kraków okolice/Gravel', start: [19.86, 50.06], steps: 35, stepKm: 0.35, heading: -0.4, loop: true, climb: 18 },
  { name: 'Gravel Bolechowice', folder: 'Kraków okolice/Gravel', start: [19.84, 50.12], steps: 50, heading: 0.2, loop: true, climb: 14 },
  { name: 'Ojców zamki', folder: 'Jura', start: [19.83, 50.21], steps: 65, heading: 0.4, loop: true, climb: 13 },
  { name: 'Szlak Orlich Gniazd odc. 1', folder: 'Jura', start: [19.8, 50.25], steps: 120, heading: -0.5, loop: false, climb: 9 },
  { name: 'Pustynia Błędowska', folder: 'Jura', start: [19.6, 50.33], steps: 60, heading: 2.5, loop: true, climb: 6 },
  { name: 'Wokół Tatr 200k', folder: 'Tatry i Podhale', start: [19.95, 49.3], steps: 300, stepKm: 0.6, heading: 1.3, loop: true, climb: 16, source: 'RideWithGPS' },
  { name: 'Velo Dunajec', folder: 'Tatry i Podhale', start: [20.03, 49.42], steps: 110, heading: 1.9, loop: false, climb: 5, source: 'VeloPlanner' },
  { name: 'Gubałówka podjazd', folder: 'Tatry i Podhale', start: [19.95, 49.3], steps: 25, stepKm: 0.3, heading: -0.7, loop: false, climb: 45 },
  { name: 'Orawa i Słowacja dzień 1', folder: 'Wyjazdy/Słowacja 2025', start: [19.6, 49.35], steps: 130, heading: 3.2, loop: false, climb: 15, multiRoute: true },
  { name: 'Orawa i Słowacja dzień 2', folder: 'Wyjazdy/Słowacja 2025', start: [19.55, 49.22], steps: 140, heading: 1.4, loop: false, climb: 18 },
  { name: 'Niedzica - Czorsztyn', folder: 'Wyjazdy/Słowacja 2025', start: [20.32, 49.42], steps: 50, heading: 0.2, loop: true, climb: 12 },
  { name: 'Wieliczka i Dobczyce', folder: 'Inbox', start: [20.05, 49.98], steps: 80, heading: 2.8, loop: true, climb: 12 },
  { name: 'Ride from Komoot 2024-06', folder: 'Inbox', start: [19.95, 50.1], steps: 45, heading: 0.9, loop: true, climb: 6, source: 'Komoot' },
]

const files: GpxFile[] = specs.map((s, i) => {
  const start = s.viaCorridor ? corridorEnd : s.start!
  let coords = walk(start, s.steps, s.stepKm ?? 0.45, s.heading, !!s.loop)
  if (s.viaCorridor) coords = [...corridor, ...coords.slice(1), ...corridor.slice().reverse()]
  const distanceKm = lengthKm(coords)
  const source = s.source ?? SOURCES[Math.floor(rng() * 4)]
  const day = 1 + Math.floor(rng() * 27)
  const month = 1 + Math.floor(rng() * 11)
  return {
    id: `f${i + 1}`,
    name: s.name,
    fileName: s.name.replace(/[^\p{L}\d]+/gu, '_') + '.gpx',
    folder: s.folder,
    distanceKm,
    elevationGainM: Math.round(distanceKm * s.climb * (0.8 + rng() * 0.4)),
    source,
    dateAdded: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    multiRoute: !!s.multiRoute,
    coords,
  }
})

// Identical Duplicate: same bytes, different name and folder ("Dolinki Krakowskie" exported twice).
const dolinki = files[2]
dolinki.identicalGroup = 'I1'
files.push({ ...dolinki, id: 'f20', fileName: 'dolinki (1).gpx', folder: 'Inbox', dateAdded: '2025-10-02', identicalGroup: 'I1' })

// Identical Duplicate triple: Ojców.
const ojcow = files[8]
ojcow.identicalGroup = 'I2'
files.push({ ...ojcow, id: 'f21', fileName: 'Ojcow_zamki_copy.gpx', folder: 'Inbox', identicalGroup: 'I2' })
files.push({ ...ojcow, id: 'f22', fileName: 'ojcow.gpx', folder: 'Jura', identicalGroup: 'I2' })

// Similar Duplicate: Puszcza re-exported from Komoot, reversed, other point density.
const puszcza = files[5]
puszcza.similarGroup = 'S1'
const puszczaRev = jitter(puszcza.coords.filter((_, i) => i % 2 === 0).reverse(), 12)
files.push({
  id: 'f23',
  name: 'Puszcza Niepołomicka (Komoot)',
  fileName: 'Puszcza_Niepolomicka_komoot.gpx',
  folder: 'Inbox',
  distanceKm: lengthKm(puszczaRev),
  elevationGainM: puszcza.elevationGainM + 23,
  source: 'Komoot',
  dateAdded: '2025-11-20',
  multiRoute: false,
  similarGroup: 'S1',
  coords: puszczaRev,
})

// Similar Duplicate that is also overlapping the corridor: Tyniec re-planned in Mapy.com.
const tyniec = files[0]
tyniec.similarGroup = 'S2'
const tyniecB = jitter(tyniec.coords, 15)
files.push({
  id: 'f24',
  name: 'Tyniec (Mapy.com)',
  fileName: 'tyniec-mapy.gpx',
  folder: 'Kraków okolice',
  distanceKm: lengthKm(tyniecB),
  elevationGainM: tyniec.elevationGainM + 8,
  source: 'Mapy.com',
  dateAdded: '2025-09-14',
  multiRoute: false,
  similarGroup: 'S2',
  coords: tyniecB,
})


export const initialFiles: GpxFile[] = files

export const folders: string[] = Array.from(
  new Set(files.flatMap((f) => f.folder.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/'))))
).sort((a, b) => a.localeCompare(b, 'pl'))

const actTypes: Activity['type'][] = ['Ride', 'Ride', 'GravelRide', 'Run', 'Hike', 'Walk']
export const activities: Activity[] = [
  // Already ridden: follow some Routes with GPS noise.
  ...[0, 1, 5, 8, 12].map((fi, i) => {
    const f = files[fi]
    const coords = jitter(f.coords, 25)
    return {
      id: `a${i + 1}`,
      name: ['Popołudniowa jazda', 'Morning Ride', 'Puszcza z ekipą', 'Jura gravel', 'Dunajec z rodziną'][i],
      type: 'Ride' as const,
      date: `2025-0${4 + i}-1${i}`,
      distanceKm: lengthKm(coords),
      stravaId: 13000000000 + i * 7919,
      coords,
    }
  }),
  // Random other Activities.
  ...Array.from({ length: 14 }, (_, i) => {
    const start: LngLat = [19.75 + rng() * 0.45, 49.95 + rng() * 0.3]
    const type = actTypes[Math.floor(rng() * actTypes.length)]
    const coords = walk(start, type === 'Ride' || type === 'GravelRide' ? 70 : 20, type === 'Ride' ? 0.5 : 0.25, rng() * 6, true)
    return {
      id: `a${i + 10}`,
      name: `${type === 'Ride' ? 'Jazda' : type} #${i + 1}`,
      type,
      date: `2024-${String(1 + (i % 12)).padStart(2, '0')}-0${1 + (i % 9)}`,
      distanceKm: lengthKm(coords),
      stravaId: 12000000000 + i * 104729,
      coords,
    }
  }),
]

export function toGpxXml(f: GpxFile) {
  const pts = f.coords.map(([lon, lat]) => `<trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="${f.source}"><metadata><name>${f.name}</name></metadata><trk><name>${f.name}</name><trkseg>${pts}</trkseg></trk></gpx>`
}
