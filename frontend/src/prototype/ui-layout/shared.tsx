// PROTOTYPE: small pieces reused across variants (icons, Sync dialog content, Trash/Settings content).
// Layout and containers are deliberately NOT shared: each variant decides where these go.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { toGpxXml, type GpxFile, type LngLat } from './fakeData'
import type { StepStatus, SyncState } from './fakeSync'
import type { Library } from './useLibrary'

export function useIsPhone() {
  const q = '(max-width: 760px)'
  const [phone, setPhone] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const h = () => setPhone(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return phone
}

export const km = (n: number) => `${n.toFixed(1)} km`
export const metres = (n: number) => `${n} m`

/** Identical = eye, Similar = two near-parallel lines. */
export function DupIcons({ f, onClick, size = 15 }: { f: GpxFile; onClick?: (kind: 'identical' | 'similar') => void; size?: number }) {
  const btn: CSSProperties = { border: 0, background: 'none', padding: '0 2px', cursor: onClick ? 'pointer' : 'default', fontSize: size, lineHeight: 1, color: 'inherit' }
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {f.identicalGroup && (
        <button style={btn} title="Identical Duplicate (same content). Click to show the group." onClick={(e) => (e.stopPropagation(), onClick?.('identical'))}>
          👁
        </button>
      )}
      {f.similarGroup && (
        <button style={btn} title="Similar Duplicate (same line). Click to show the group." onClick={(e) => (e.stopPropagation(), onClick?.('similar'))}>
          <SimilarIcon size={size} />
        </button>
      )}
      {f.multiRoute && (
        <span title="Multi-route: this GPX File holds more than one line" style={{ fontSize: size * 0.7, border: '1px solid currentColor', borderRadius: 4, padding: '0 3px', marginLeft: 2, opacity: 0.7 }}>
          multi
        </span>
      )}
    </span>
  )
}

export function SimilarIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ verticalAlign: '-2px' }}>
      <path d="M1 6c3-3 5 3 8 0s4-1 6 0" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M1 11c3-3 5 3 8 0s4-1 6 0" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

export function SyncIcon({ spinning, size = 18 }: { spinning: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: spinning ? 'proto-spin 1s linear infinite' : undefined }}>
      <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18.5 3v4.5H14M5.5 21v-4.5H10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Tiny SVG of the Route's shape. */
export function RouteThumb({ coords, size = 44, color = '#2f6fde' }: { coords: LngLat[]; size?: number; color?: string }) {
  const xs = coords.map((c) => c[0] * Math.cos((c[1] * Math.PI) / 180))
  const ys = coords.map((c) => c[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const s = Math.max(maxX - minX, maxY - minY) || 1
  const pad = 4
  const k = (size - pad * 2) / s
  const ox = (size - (maxX - minX) * k) / 2
  const oy = (size - (maxY - minY) * k) / 2
  const d = coords.map((_, i) => `${i ? 'L' : 'M'}${(ox + (xs[i] - minX) * k).toFixed(1)},${(size - oy - (ys[i] - minY) * k).toFixed(1)}`).join('')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: 'none' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export async function shareOrDownload(f: GpxFile) {
  const file = new File([toGpxXml(f)], f.fileName, { type: 'application/gpx+xml' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: f.name })
      return
    } catch {
      /* cancelled */
    }
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = f.fileName
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Long-press (touch) or hover (mouse) highlights; tap/click picks. */
export function usePressHighlight(setHover: (id: string | null) => void) {
  const timer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)
  return (id: string, onPick: () => void) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onTouchStart: () => {
      longPressed.current = false
      timer.current = window.setTimeout(() => {
        longPressed.current = true
        setHover(id)
        navigator.vibrate?.(15)
      }, 380)
    },
    onTouchEnd: () => clearTimeout(timer.current),
    onTouchMove: () => clearTimeout(timer.current),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (longPressed.current) {
        longPressed.current = false
        return
      }
      setHover(null)
      onPick()
    },
  })
}

export const PICKER_COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324']

// ---------- Sync dialog content ----------

const statusMark = (s: StepStatus) =>
  s === 'ok' ? <span style={{ color: '#16a34a' }}>✓</span> : s === 'failed' ? <span style={{ color: '#dc2626' }}>✗</span> : s === 'running' ? <span className="proto-dots">●</span> : <span style={{ opacity: 0.35 }}>○</span>

export function SyncLoaded({ state }: { state: SyncState }) {
  return (
    <div className="proto-sync-col">
      <h4>Loaded</h4>
      {state.loaded.map((s) => (
        <div key={s.label} className="proto-sync-row">
          <span className="proto-sync-mark">{statusMark(s.status)}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{s.label}</div>
            {s.detail && <div style={{ fontSize: 12, opacity: 0.75, color: s.status === 'failed' ? '#dc2626' : undefined }}>{s.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SyncProcessing({ state }: { state: SyncState }) {
  return (
    <div className="proto-sync-col">
      <h4>Processing</h4>
      {state.processing.map((s) => (
        <div key={s.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>
              {s.status === 'failed' && <span style={{ color: '#dc2626' }}>✗ </span>}
              {s.label}
            </span>
            <span style={{ opacity: 0.7 }}>{s.status === 'failed' ? 'failed' : `${s.progress}%`}</span>
          </div>
          <div className="proto-bar">
            <div style={{ width: `${s.progress}%`, background: s.status === 'ok' ? '#16a34a' : '#2f6fde' }} />
          </div>
          {s.detail && <div style={{ fontSize: 11, opacity: 0.7 }}>{s.detail}</div>}
        </div>
      ))}
    </div>
  )
}

export function SyncProblems({ state }: { state: SyncState }) {
  if (!state.problems.length) return null
  return (
    <div className="proto-sync-problems">
      <h4>Problems ({state.problems.length})</h4>
      <ul>
        {state.problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Trash & Settings content ----------

export function TrashList({ lib }: { lib: Library }) {
  if (!lib.trash.length) return <p style={{ opacity: 0.6 }}>Trash is empty. Delete a GPX File to see it here.</p>
  return (
    <div>
      <table className="proto-table">
        <thead>
          <tr>
            <th>Original path</th>
            <th>Deleted</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lib.trash.map((t) => (
            <tr key={t.file.id}>
              <td>{t.originalPath}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{t.deletedAt}</td>
              <td>
                <button onClick={() => lib.restore(t.file.id)}>Restore</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button style={{ marginTop: 12, color: '#dc2626' }} onClick={lib.emptyTrash}>
        Empty Trash…
      </button>
    </div>
  )
}

export function SettingsForm() {
  const [v, setV] = useState('')
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontWeight: 600 }}>Statshunters share link</label>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://statshunters.com/share/…" style={{ padding: 8, font: 'inherit' }} />
      <small style={{ opacity: 0.7 }}>Used to read Ride History. Line sharing must be enabled on the link. (Prototype: not stored.)</small>
      <div style={{ display: 'flex', gap: 8 }}>
        <button>Save</button>
        <button onClick={() => setV('')}>Remove link</button>
      </div>
      <hr style={{ width: '100%', opacity: 0.2 }} />
      <button style={{ justifySelf: 'start' }}>Log out</button>
    </div>
  )
}
