// PROTOTYPE Variant B, "Map-first": the map fills the screen, no header bar. One floating card (desktop) or
// draggable bottom sheet (phone) is a navigation stack: results list → file detail / overlap picker / folders /
// Trash / Settings. Map-style control buttons top-right. Sync = non-modal dark card that floats over the map.
import { useRef, useState, type ReactNode } from 'react'
import type { VariantProps } from '../PrototypeApp'
import { folders } from '../fakeData'
import { MapView, RIDE_HISTORY_COLOR, type PickEvent } from '../MapView'
import { DupIcons, km, RouteThumb, SettingsForm, shareOrDownload, SyncIcon, SyncLoaded, SyncProblems, SyncProcessing, TrashList, usePressHighlight } from '../shared'

type View = { kind: 'list' } | { kind: 'detail' } | { kind: 'picker'; ids: string[] } | { kind: 'folders' } | { kind: 'trash' } | { kind: 'settings' }

export function VariantB({ lib, sync, phone }: VariantProps) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [listOpen, setListOpen] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const [syncExpanded, setSyncExpanded] = useState(true)
  const press = usePressHighlight(lib.setHoverId)

  // Phone sheet snap points (px from bottom).
  const snaps = phone ? [150, Math.round(innerHeight * 0.5), Math.round(innerHeight * 0.9)] : []
  const [sheetH, setSheetH] = useState(150)
  const drag = useRef<{ y: number; h: number } | null>(null)
  const snapTo = (i: number) => setSheetH(snaps[i])

  const go = (v: View) => {
    setView(v)
    setListOpen(true)
    if (phone && sheetH < snaps[1]) snapTo(1)
  }
  const select = (id: string) => {
    lib.setSelectedId(id)
    go({ kind: 'detail' })
  }
  const onPick = (e: PickEvent) => {
    if (e.ids.length === 1) select(e.ids[0])
    else if (e.ids.length > 1) go({ kind: 'picker', ids: e.ids })
    else if (view.kind === 'detail' || view.kind === 'picker') {
      lib.setSelectedId(null)
      setView({ kind: 'list' })
    }
  }
  const back = () => {
    if (view.kind === 'detail') lib.setSelectedId(null)
    setView({ kind: 'list' })
  }

  const sel = lib.selected
  const folderLabel = lib.folder ? lib.folder.split('/').pop() : 'Library'

  const searchBar = (
    <>
      <div className="b-searchbar">
        <span style={{ fontSize: 18, opacity: 0.5 }}>⌕</span>
        <input placeholder={`Search in ${folderLabel}…`} value={lib.search} onChange={(e) => lib.setSearch(e.target.value)} onFocus={() => (setView({ kind: 'list' }), phone && sheetH < snaps[1] && snapTo(1))} />
        {!phone && (
          <button onClick={() => setListOpen((o) => !o)} style={{ border: 0, background: 'none', fontSize: 13, color: '#2f6fde' }}>
            {listOpen ? 'Hide list' : `Show list (${lib.visible.length})`}
          </button>
        )}
      </div>
      <div className="b-chips">
        <button className={`b-chip ${lib.folder ? 'on' : ''}`} onClick={() => go({ kind: 'folders' })}>
          📁 {folderLabel} ▾
        </button>
        <button className={`b-chip ${lib.duplicatesOnly ? 'on' : ''}`} onClick={() => lib.setDuplicatesOnly(!lib.duplicatesOnly)}>
          👁 Duplicates only
        </button>
        {lib.dupFilter && (
          <button className="b-chip on" onClick={() => lib.setDupFilter(null)}>
            {lib.dupFilter.label} ✕
          </button>
        )}
      </div>
    </>
  )

  let body: ReactNode = null
  if (view.kind === 'list') {
    body = (
      <div className="b-list">
        <div style={{ padding: '6px 14px', fontSize: 12, opacity: 0.6 }}>{lib.visible.length} Routes on the map</div>
        {lib.visible.map((f) => (
          <div key={f.id} className={`b-row ${lib.hoverId === f.id ? 'hov' : ''}`} onClick={() => select(f.id)} onMouseEnter={() => lib.setHoverId(f.id)} onMouseLeave={() => lib.setHoverId(null)}>
            <RouteThumb coords={f.coords} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <div className="meta">
                {km(f.distanceKm)} · ↑{f.elevationGainM} m · {f.source}
              </div>
            </div>
            <DupIcons f={f} onClick={(k) => lib.showDuplicates(f, k)} />
          </div>
        ))}
      </div>
    )
  } else if (view.kind === 'detail' && sel) {
    body = (
      <>
        <button className="b-back" onClick={back}>
          ‹ {lib.visible.length} Routes
        </button>
        <div className="b-detail">
          <div style={{ fontSize: 12, opacity: 0.6 }}>📁 {sel.folder || 'Library'}</div>
          <h2>{sel.name}</h2>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{sel.fileName}</div>
          <div className="b-stats">
            <div>
              <b>{sel.distanceKm.toFixed(1)}</b>
              <span>km</span>
            </div>
            <div>
              <b>{sel.elevationGainM}</b>
              <span>m ↑</span>
            </div>
            <div>
              <b style={{ fontSize: 13, lineHeight: '22px' }}>{sel.source}</b>
              <span>source</span>
            </div>
          </div>
          {(sel.identicalGroup || sel.similarGroup) && (
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '8px 10px', fontSize: 13, marginBottom: 12 }}>
              <DupIcons f={sel} onClick={(k) => lib.showDuplicates(sel, k)} /> {sel.identicalGroup ? 'Has Identical Duplicates' : 'Has Similar Duplicates'}
            </div>
          )}
          <div className="b-bigbtns">
            <button onClick={() => shareOrDownload(sel)}>
              <span className="ic">⤴</span>Share / Download
            </button>
            <button disabled={!sel.identicalGroup && !sel.similarGroup} style={{ opacity: sel.identicalGroup || sel.similarGroup ? 1 : 0.35 }} onClick={() => (lib.showDuplicates(sel, sel.identicalGroup ? 'identical' : 'similar'), setView({ kind: 'list' }))}>
              <span className="ic">⧉</span>Duplicates
            </button>
            <button className="danger" onClick={() => (lib.deleteFile(sel.id), setView({ kind: 'list' }))}>
              <span className="ic">🗑</span>Delete
            </button>
          </div>
        </div>
      </>
    )
  } else if (view.kind === 'picker') {
    body = (
      <>
        <button className="b-back" onClick={back}>
          ‹ Back
        </button>
        <div style={{ padding: '6px 14px', fontWeight: 600 }}>{view.ids.length} Routes here: which one?</div>
        <div className="b-list" style={{ borderTop: 0 }}>
          {view.ids.map((id) => {
            const f = lib.files.find((x) => x.id === id)!
            return (
              <div key={id} className={`b-row ${lib.hoverId === id ? 'hov' : ''}`} {...press(id, () => select(id))}>
                <RouteThumb coords={f.coords} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{f.name}</div>
                  <div className="meta">
                    {km(f.distanceKm)} · {f.folder || 'Library'}
                  </div>
                </div>
                <DupIcons f={f} />
              </div>
            )
          })}
          <div style={{ padding: '6px 14px 12px', fontSize: 11, opacity: 0.55 }}>{phone ? 'Long-press' : 'Hover'} to highlight on the map.</div>
        </div>
      </>
    )
  } else if (view.kind === 'folders') {
    body = (
      <>
        <button className="b-back" onClick={back}>
          ‹ Back
        </button>
        <div className="b-list" style={{ borderTop: 0 }}>
          {['', ...folders].map((f) => (
            <div key={f} className="b-row" style={{ paddingLeft: 14 + 16 * (f ? f.split('/').length : 0), fontWeight: lib.folder === f ? 700 : 400 }} onClick={() => (lib.setFolder(f), setView({ kind: 'list' }))}>
              {f ? '📁 ' + f.split('/').pop() : '📚 Library (all)'}
              <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 12 }}>{f ? lib.files.filter((x) => x.folder === f || x.folder.startsWith(f + '/')).length : lib.files.length}</span>
            </div>
          ))}
        </div>
      </>
    )
  } else if (view.kind === 'trash' || view.kind === 'settings') {
    body = (
      <>
        <button className="b-back" onClick={back}>
          ‹ Back to map
        </button>
        <div style={{ padding: '8px 16px 16px', overflow: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>{view.kind === 'trash' ? 'Trash' : 'Settings'}</h3>
          {view.kind === 'trash' ? <TrashList lib={lib} /> : <SettingsForm />}
        </div>
      </>
    )
  }

  const controls = (
    <div className="b-controls" style={phone ? { top: 'calc(10px + env(safe-area-inset-top))' } : undefined}>
      <button className="b-ctl" title={sync.running ? 'Sync running: show progress' : 'Sync Now'} onClick={() => (sync.running ? (sync.setOpen(true), setSyncExpanded(true)) : (sync.start(), setSyncExpanded(true)))}>
        <SyncIcon spinning={sync.running} size={20} />
      </button>
      <div style={{ position: 'relative' }}>
        <button className="b-ctl" title="Layers" onClick={() => setLayersOpen((o) => !o)}>
          ◫
        </button>
        {layersOpen && (
          <div className="b-pop">
            <b>Map layers</b>
            <label>
              <input type="checkbox" checked readOnly /> <span style={{ color: '#2f6fde' }}>━</span> Routes
            </label>
            <label>
              <input type="checkbox" checked={lib.showRideHistory} onChange={(e) => lib.setShowRideHistory(e.target.checked)} /> <span style={{ color: RIDE_HISTORY_COLOR }}>━</span> Ride History
            </label>
          </div>
        )}
      </div>
      <button className="b-ctl" title="Trash" onClick={() => go({ kind: 'trash' })}>
        🗑{lib.trash.length > 0 && <span className="a-badge">{lib.trash.length}</span>}
      </button>
      <button className="b-ctl" title="Settings" onClick={() => go({ kind: 'settings' })}>
        ⚙
      </button>
    </div>
  )

  const syncCard = sync.open && sync.state && (
    <div className="b-sync" style={phone ? undefined : { left: 'auto', right: 68, bottom: 64 }}>
      <div className="b-sync-head">
        <SyncIcon spinning={sync.running} />
        <b>{sync.running ? 'Loading and processing data…' : 'Sync finished'}</b>
        <button className="lnk" onClick={() => setSyncExpanded((x) => !x)}>
          {syncExpanded ? 'less' : 'details'}
        </button>
        <button onClick={() => sync.setOpen(false)}>Close</button>
      </div>
      {syncExpanded ? (
        <>
          <div className="b-sync-grid">
            <SyncLoaded state={sync.state} />
            <SyncProcessing state={sync.state} />
          </div>
          <SyncProblems state={sync.state} />
        </>
      ) : (
        <div className="proto-bar" style={{ marginTop: 10 }}>
          <div style={{ width: `${Math.round(sync.state.processing.reduce((s, p) => s + p.progress, 0) / 3)}%`, background: '#60a5fa' }} />
        </div>
      )}
    </div>
  )

  const map = (
    <MapView
      files={lib.visible}
      showRideHistory={lib.showRideHistory}
      selectedId={lib.selectedId}
      hoverId={lib.hoverId}
      onPick={onPick}
      styleName="liberty"
      accent="#7c3aed"
      padding={phone ? { bottom: sheetH + 20 } : listOpen ? { left: 400 } : undefined}
    />
  )

  if (phone) {
    return (
      <div className="b-root">
        {map}
        {controls}
        {syncCard}
        <div className="b-sheet" style={{ height: sheetH }}>
          <div
            className="grabzone"
            onPointerDown={(e) => {
              drag.current = { y: e.clientY, h: sheetH }
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => drag.current && setSheetH(Math.max(100, Math.min(innerHeight * 0.95, drag.current.h + drag.current.y - e.clientY)))}
            onPointerUp={(e) => {
              const moved = drag.current && Math.abs(drag.current.y - e.clientY) > 5
              drag.current = null
              if (!moved) return snapTo(sheetH >= snaps[2] - 5 ? 0 : sheetH >= snaps[1] - 5 ? 2 : 1)
              const nearest = snaps.reduce((b, s, i) => (Math.abs(s - sheetH) < Math.abs(snaps[b] - sheetH) ? i : b), 0)
              snapTo(nearest)
            }}
          >
            <div className="grab" />
          </div>
          {searchBar}
          <div className="scroll">{body}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="b-root">
      {map}
      <div className="b-card">
        {searchBar}
        {(listOpen || view.kind !== 'list') && <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>{body}</div>}
      </div>
      {controls}
      {syncCard}
    </div>
  )
}
