// Variant D shell (see the UI prototype on branch prototype/ui-layout): a full-screen map, a full-height floating
// panel on the left and floating map-style buttons top-right. The panel and buttons are empty / inert for now.
import { MapView } from './MapView'
import { MapControls } from './MapControls'

export function App() {
  return (
    <div className="shell">
      <MapView className="map" />
      <aside className="panel" aria-label="Routes" />
      <MapControls />
    </div>
  )
}
