// PROTOTYPE: floating variant switcher. Not part of the design being evaluated. Hidden in production builds.
import { useEffect, useState } from 'react'

export interface VariantMeta {
  key: string
  name: string
}

export function PrototypeSwitcher({ variants, current, onChange, debug }: { variants: VariantMeta[]; current: string; onChange: (k: string) => void; debug: unknown }) {
  const [showState, setShowState] = useState(false)
  const i = Math.max(0, variants.findIndex((v) => v.key === current))
  const go = (d: number) => onChange(variants[(i + d + variants.length) % variants.length].key)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  })

  const phone = matchMedia('(max-width: 760px)').matches
  if (import.meta.env.PROD) return null
  const btn = { background: 'none', border: 0, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '4px 10px' }
  return (
    <div
      style={
        phone
          ? { position: 'fixed', left: 4, top: '42%', zIndex: 10000, font: '11px ui-monospace, monospace', opacity: 0.92 }
          : { position: 'fixed', left: '50%', bottom: 'calc(10px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 10000, font: '13px ui-monospace, monospace' }
      }
    >
      {showState && (
        <pre style={{ position: 'absolute', bottom: 44, left: phone ? 0 : '50%', transform: phone ? undefined : 'translateX(-50%)', width: 'min(360px, 92vw)', maxHeight: '40vh', overflow: 'auto', background: '#111', color: '#9f9', padding: 10, borderRadius: 8, fontSize: 11, margin: 0 }}>
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
      <div style={{ display: 'flex', alignItems: 'center', background: '#ff2d87', color: '#fff', borderRadius: 999, boxShadow: '0 4px 18px rgba(0,0,0,.35)', border: '2px solid #fff', whiteSpace: 'nowrap' }}>
        <button style={btn} onClick={() => go(-1)} aria-label="Previous variant">
          ◀
        </button>
        <span style={{ fontWeight: 700 }}>
          {variants[i].key} {!phone && <span style={{ fontWeight: 400 }}>({variants[i].name})</span>}
        </span>
        <button style={btn} onClick={() => go(1)} aria-label="Next variant">
          ▶
        </button>
        <button style={{ ...btn, fontSize: 11, borderLeft: '1px solid rgba(255,255,255,.4)' }} onClick={() => setShowState((s) => !s)}>
          state
        </button>
      </div>
    </div>
  )
}
