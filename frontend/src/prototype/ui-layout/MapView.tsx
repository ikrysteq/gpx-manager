// PROTOTYPE: shared MapLibre map (OpenFreeMap tiles). Variants own everything around it.
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { PaddingOptions } from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { activities, type GpxFile, type LngLat } from './fakeData'

export const RIDE_HISTORY_COLOR = '#e8743b'

export interface PickEvent {
  ids: string[] // Routes under the pointer/finger, top first; [] = empty map
  point: { x: number; y: number } // relative to the map container
}

interface Props {
  files: GpxFile[]
  showRideHistory: boolean
  selectedId: string | null
  hoverId: string | null
  /** Overlap picker "colour lens": draw these Routes in distinct colours. */
  candidateColors?: Record<string, string> | null
  onPick: (e: PickEvent) => void
  accent?: string
  styleName?: 'positron' | 'liberty' | 'bright'
  padding?: Partial<PaddingOptions>
  className?: string
}

const fc = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features })
const line = (id: string, coords: LngLat[], props: Record<string, unknown> = {}): GeoJSON.Feature => ({
  type: 'Feature',
  properties: { id, ...props },
  geometry: { type: 'LineString', coordinates: coords },
})

function bounds(coordsList: LngLat[][]) {
  const b = new maplibregl.LngLatBounds()
  coordsList.forEach((cs) => cs.forEach((c) => b.extend(c)))
  return b
}

export function MapView({ files, showRideHistory, selectedId, hoverId, candidateColors, onPick, accent = '#2f6fde', styleName = 'positron', padding, className }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const latest = useRef({ onPick, files, padding })
  latest.current = { onPick, files, padding }

  useEffect(() => {
    const map = new maplibregl.Map({
      container: el.current!,
      style: `https://tiles.openfreemap.org/styles/${styleName}`,
      center: [19.94, 50.0],
      zoom: 8.5,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.on('load', () => {
      map.addSource('activities', { type: 'geojson', data: fc(activities.map((a) => line(a.id, a.coords, { name: a.name, type: a.type, date: a.date, km: a.distanceKm.toFixed(1), strava: a.stravaId }))) })
      map.addSource('routes', { type: 'geojson', data: fc([]) })
      map.addLayer({ id: 'ride-history', type: 'line', source: 'activities', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': RIDE_HISTORY_COLOR, 'line-opacity': 0.45, 'line-width': 3 } })
      map.addLayer({ id: 'routes', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': accent, 'line-opacity': 0.85, 'line-width': 2.5 } })
      map.addLayer({ id: 'routes-candidates', type: 'line', source: 'routes', filter: ['in', ['get', 'id'], ['literal', []]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-width': 5 } })
      map.addLayer({ id: 'routes-hover', type: 'line', source: 'routes', filter: ['==', ['get', 'id'], ''], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffd400', 'line-width': 7, 'line-opacity': 0.9 } })
      map.addLayer({ id: 'routes-selected-casing', type: 'line', source: 'routes', filter: ['==', ['get', 'id'], ''], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 9 } })
      map.addLayer({ id: 'routes-selected', type: 'line', source: 'routes', filter: ['==', ['get', 'id'], ''], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': accent, 'line-width': 5.5 } })
      setReady(true)
    })

    const hitBox = (p: maplibregl.Point, r: number): [maplibregl.PointLike, maplibregl.PointLike] => [
      [p.x - r, p.y - r],
      [p.x + r, p.y + r],
    ]
    map.on('mousemove', (e) => {
      const hit = map.queryRenderedFeatures(hitBox(e.point, 6), { layers: ['routes', 'ride-history'] })
      map.getCanvas().style.cursor = hit.length ? 'pointer' : ''
    })
    map.on('click', (e) => {
      const touch = matchMedia('(pointer: coarse)').matches
      const hits = map.queryRenderedFeatures(hitBox(e.point, touch ? 14 : 7), { layers: ['routes'] })
      const ids = Array.from(new Set<string>(hits.map((h: maplibregl.MapGeoJSONFeature) => h.properties!.id as string)))
      if (ids.length === 0) {
        const act = map.queryRenderedFeatures(hitBox(e.point, touch ? 12 : 5), { layers: ['ride-history'] })[0]
        if (act) {
          const p = act.properties!
          new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font:13px system-ui"><b>${p.name}</b><br>${p.type} · ${p.date} · ${p.km} km<br><a href="https://www.strava.com/activities/${p.strava}" target="_blank" rel="noreferrer">Open on Strava ↗</a><div style="color:#888;margin-top:4px;font-size:11px">Activity (Ride History)</div></div>`)
            .addTo(map)
        }
      }
      latest.current.onPick({ ids, point: { x: e.point.x, y: e.point.y } })
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(el.current!)
    return () => {
      ro.disconnect()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const map = mapRef.current
  const idsKey = files.map((f) => f.id).join(',')

  // Routes data + fit to the current selection set.
  useEffect(() => {
    if (!ready || !map) return
    ;(map.getSource('routes') as maplibregl.GeoJSONSource).setData(fc(files.map((f) => line(f.id, f.coords))))
    if (files.length) map.fitBounds(bounds(files.map((f) => f.coords)), { padding: { top: 40, bottom: 40, left: 40, right: 40, ...latest.current.padding }, duration: 600, maxZoom: 13 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey])

  useEffect(() => {
    if (!ready || !map) return
    map.setLayoutProperty('ride-history', 'visibility', showRideHistory ? 'visible' : 'none')
  }, [ready, map, showRideHistory])

  useEffect(() => {
    if (!ready || !map) return
    map.setFilter('routes-selected', ['==', ['get', 'id'], selectedId ?? ''])
    map.setFilter('routes-selected-casing', ['==', ['get', 'id'], selectedId ?? ''])
    const f = latest.current.files.find((x) => x.id === selectedId)
    if (f) map.fitBounds(bounds([f.coords]), { padding: { top: 60, bottom: 60, left: 60, right: 60, ...latest.current.padding }, duration: 700, maxZoom: 14 })
  }, [ready, map, selectedId])

  useEffect(() => {
    if (!ready || !map) return
    map.setFilter('routes-hover', ['==', ['get', 'id'], hoverId ?? ''])
  }, [ready, map, hoverId])

  useEffect(() => {
    if (!ready || !map) return
    const entries = Object.entries(candidateColors ?? {})
    map.setFilter('routes-candidates', ['in', ['get', 'id'], ['literal', entries.map(([id]) => id)]])
    if (entries.length) map.setPaintProperty('routes-candidates', 'line-color', ['match', ['get', 'id'], ...entries.flat(), '#000'] as unknown as maplibregl.ExpressionSpecification)
    map.setPaintProperty('routes', 'line-opacity', entries.length ? 0.25 : 0.85)
  }, [ready, map, candidateColors])

  return <div ref={el} className={className} style={{ width: '100%', height: '100%' }} />
}
