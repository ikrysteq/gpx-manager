export function SyncIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18.5 3v4.5H14M5.5 21v-4.5H10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Floating map-style buttons, top-right. Inert until their features land. */
export function MapControls() {
  return (
    <nav className="controls" aria-label="Map controls">
      <button type="button" className="ctl" title="Sync Now" aria-label="Sync Now">
        <SyncIcon />
      </button>
      <button type="button" className="ctl" title="Layers" aria-label="Layers">
        ◫
      </button>
      <button type="button" className="ctl" title="Trash" aria-label="Trash">
        🗑
      </button>
      <button type="button" className="ctl" title="Settings" aria-label="Settings">
        ⚙
      </button>
    </nav>
  )
}
