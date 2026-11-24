import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// maplibre-gl v6 looks for its worker next to its own module, which no longer exists once Vite bundles it.
// Point it at the worker file Vite emits instead (also why maplibre-gl is excluded from pre-bundling in dev).
maplibregl.setWorkerUrl(workerUrl)

// OpenFreeMap: OpenStreetMap-based vector tiles, no API key.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export function MapView({ className }: { className?: string }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const map = new maplibregl.Map({
      container: el.current!,
      style: STYLE_URL,
      center: [19.94, 50.0],
      zoom: 8.5,
      attributionControl: { compact: true },
    })
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(el.current!)
    return () => {
      ro.disconnect()
      map.remove()
    }
  }, [])

  return <div ref={el} className={className} data-testid="map" />
}
