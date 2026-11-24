// The real app does not exist yet. For now the root renders the throwaway UI prototype.
import { createRoot } from 'react-dom/client'
import 'maplibre-gl/dist/maplibre-gl.css'
import { PrototypeApp } from './prototype/ui-layout/PrototypeApp'

createRoot(document.getElementById('root')!).render(<PrototypeApp />)
