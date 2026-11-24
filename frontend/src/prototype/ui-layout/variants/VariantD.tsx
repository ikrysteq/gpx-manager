// PROTOTYPE Variant D, "B look + C function" (user's pick after round 1):
// B's map-first design (full-screen map, floating rounded panels, map-style controls top-right, dark Sync card),
// with the left panel stretched to full height like C's column, and C's functionality inside it: breadcrumb
// folders, sort dropdown, shape-thumbnail rows that expand inline into the file panel, colour-lens overlap
// picker, Trash/Settings replacing the panel content. Phone: B's draggable bottom sheet holding the same content.
import { useMemo, useRef, useState } from 'react'
import type { VariantProps } from '../PrototypeApp'
import { folders, type GpxFile } from '../fakeData'
import { MapView, RIDE_HISTORY_COLOR, type PickEvent } from '../MapView'
import { DupIcons, km, metres, PICKER_COLORS, RouteThumb, SettingsForm, shareOrDownload, SyncIcon, SyncLoaded, SyncProblems, SyncProcessing, TrashList, usePressHighlight } from '../shared'

type SortKey = 'name' | 'distanceKm' | 'elevationGainM' | 'dateAdded' | 'source'
const SORTS: [SortKey, string][] = [
  ['name', 'Name'],
  ['distanceKm', 'Distance'],
  ['elevationGainM', 'Elevation'],
  ['dateAdded', 'Date added'],
  ['source', 'Source'],
]
const ACCENT = '#7c3aed'

export function VariantD({ lib, sync, phone }: VariantProps) {
  const [section, setSection] = useState<'library' | 'trash' | 'settings'>('library')
  const [lens, setLens] = useState<string[] | null>(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>('dateAdded')
  const [desc, setDesc] = useState(true)
  const [mode, setMode] = useState<'list' | 'tree'>('list')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const press = usePressHighlight(lib.setHoverId)

  // Phone sheet snap points (px from bottom).
  const snaps = phone ? [150, Math.round(innerHeight * 0.5), Math.round(innerHeight * 0.9)] : []
  const [sheetH, setSheetH] = useState(150)
  const drag = useRef<{ y: number; h: number } | null>(null)

  const sorted = useMemo(() => {
    const s = [...lib.visible].sort((a, b) => (a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : 0))
    return desc ? s.reverse() : s
  }, [lib.visible, sort, desc])

  const lensColors = lens ? Object.fromEntries(lens.map((id, i) => [id, PICKER_COLORS[i % PICKER_COLORS.length]])) : null

  const select = (id: string | null) => {
    lib.setSelectedId(id)
    setLens(null)
    if (id) {
      setSection('library')
      if (phone && sheetH < snaps[1]) setSheetH(snaps[1])
      setTimeout(() => document.getElementById(`d-item-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80)
    }
  }
  const onPick = (e: PickEvent) => {
    if (e.ids.length === 1) select(e.ids[0])
    else if (e.ids.length > 1) setLens(e.ids)
    else select(null)
  }

  const crumbs = lib.folder ? lib.folder.split('/') : []
  const children = folders.filter((f) => (lib.folder ? f.startsWith(lib.folder + '/') : true) && f.split('/').length === crumbs.length + 1)

  const expanded = (f: GpxFile) => (
    <div className="d-expand">
      <div className="b-stats" style={{ margin: 0 }}>
        <div>
          <b>{f.distanceKm.toFixed(1)}</b>
          <span>km</span>
        </div>
        <div>
          <b>{f.elevationGainM}</b>
          <span>m ↑</span>
        </div>
        <div>
          <b style={{ fontSize: 13, lineHeight: '22px' }}>{f.source}</b>
          <span>source</span>
        </div>
      </div>
      <div className="d-facts">
        <span>Folder</span>
        <span>{f.folder || 'Library'}</span>
        <span>File</span>
        <span style={{ wordBreak: 'break-all' }}>{f.fileName}</span>
        <span>Added</span>
        <span>{f.dateAdded}</span>
        {(f.identicalGroup || f.similarGroup) && (
          <>
            <span>Duplicates</span>
            <span>
              <DupIcons f={f} onClick={(k) => lib.showDuplicates(f, k)} /> {f.identicalGroup ? 'Identical' : ''} {f.similarGroup ? 'Similar' : ''}
            </span>
          </>
        )}
      </div>
      <div className="b-bigbtns">
        <button onClick={() => shareOrDownload(f)}>
          <span className="ic">⤴</span>Share / Download
        </button>
        <button disabled={!f.identicalGroup && !f.similarGroup} style={{ opacity: f.identicalGroup || f.similarGroup ? 1 : 0.35 }} onClick={() => lib.showDuplicates(f, f.identicalGroup ? 'identical' : 'similar')}>
          <span className="ic">⧉</span>Duplicates
        </button>
        <button className="danger" onClick={() => lib.deleteFile(f.id)}>
          <span className="ic">🗑</span>Delete
        </button>
      </div>
    </div>
  )

  const head = (
    <div className="d-head">
      <div className="b-searchbar" style={{ padding: 0 }}>
        <span style={{ fontSize: 18, opacity: 0.5 }}>⌕</span>
        <input
          placeholder={`Search in ${lib.folder ? lib.folder.split('/').pop() : 'Library'}…`}
          value={lib.search}
          onChange={(e) => lib.setSearch(e.target.value)}
          onFocus={() => phone && sheetH < snaps[1] && setSheetH(snaps[1])}
        />
      </div>
      <div className="d-crumbs">
        <button onClick={() => lib.setFolder('')} className={crumbs.length ? '' : 'on'}>
          📚 Library
        </button>
        {crumbs.map((c, i) => (
          <span key={i}>
            ›
            <button onClick={() => lib.setFolder(crumbs.slice(0, i + 1).join('/'))} className={i === crumbs.length - 1 ? 'on' : ''}>
              {c}
            </button>
          </span>
        ))}
        {children.length > 0 && (
          <select value="" onChange={(e) => lib.setFolder(e.target.value)}>
            <option value="">› subfolder…</option>
            {children.map((c) => (
              <option key={c} value={c}>
                {c.split('/').pop()}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="b-chips" style={{ padding: 0, alignItems: 'center' }}>
        <span className="b-chip" style={{ paddingRight: 4 }}>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ border: 0, background: 'none', font: 'inherit', fontWeight: 600 }}>
            {SORTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <button onClick={() => setDesc((d) => !d)} style={{ border: 0, background: 'none', padding: '0 4px' }}>
            {desc ? '↓' : '↑'}
          </button>
        </span>
        <button className={`b-chip ${lib.duplicatesOnly ? 'on' : ''}`} onClick={() => lib.setDuplicatesOnly(!lib.duplicatesOnly)}>
          👁 Duplicates only
        </button>
        {lib.dupFilter && (
          <button className="b-chip on" onClick={() => lib.setDupFilter(null)}>
            {lib.dupFilter.label} ✕
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{sorted.length} Routes on the map</span>
        <div className="d-seg">
          <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')} title="Flat list">
            ☰ List
          </button>
          <button className={mode === 'tree' ? 'on' : ''} onClick={() => setMode('tree')} title="Grouped by folder">
            ⌥ Tree
          </button>
        </div>
      </div>
    </div>
  )

  const row = (f: GpxFile, depth = 0) => {
    const open = f.id === lib.selectedId
    return (
      <div key={f.id} id={`d-item-${f.id}`} className={`d-item ${open ? 'open' : ''}`} onMouseEnter={() => lib.setHoverId(f.id)} onMouseLeave={() => lib.setHoverId(null)}>
        <div className={`b-row ${lib.hoverId === f.id && !open ? 'hov' : ''}`} style={{ paddingLeft: 14 + depth * 16 }} onClick={() => select(open ? null : f.id)}>
          <RouteThumb coords={f.coords} size={depth ? 32 : 40} color={open ? ACCENT : '#2f6fde'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>{f.name}</div>
            <div className="meta">{mode === 'tree' ? f.source : `${f.folder || 'Library'} · ${f.source}`}</div>
          </div>
          <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            <div style={{ fontWeight: 600 }}>{km(f.distanceKm)}</div>
            <div className="meta">↑ {metres(f.elevationGainM)}</div>
          </div>
          <DupIcons f={f} size={13} onClick={(k) => lib.showDuplicates(f, k)} />
        </div>
        {open && expanded(f)}
      </div>
    )
  }

  // Tree: the visible (filtered + sorted) GPX Files grouped under the current folder's subfolders.
  const tree = useMemo(() => {
    interface Node { path: string; name: string; folders: Map<string, Node>; files: GpxFile[]; count: number }
    const root: Node = { path: lib.folder, name: '', folders: new Map(), files: [], count: 0 }
    const base = lib.folder ? lib.folder.split('/').length : 0
    for (const f of sorted) {
      const parts = f.folder ? f.folder.split('/') : []
      let n = root
      n.count++
      for (let i = base; i < parts.length; i++) {
        const path = parts.slice(0, i + 1).join('/')
        if (!n.folders.has(parts[i])) n.folders.set(parts[i], { path, name: parts[i], folders: new Map(), files: [], count: 0 })
        n = n.folders.get(parts[i])!
        n.count++
      }
      n.files.push(f)
    }
    return root
  }, [sorted, lib.folder])
  type TreeNode = typeof tree

  const toggle = (path: string) =>
    setCollapsed((c) => {
      const n = new Set(c)
      if (n.has(path)) n.delete(path)
      else n.add(path)
      return n
    })
  const renderNode = (n: TreeNode, depth: number): React.ReactNode => (
    <>
      {[...n.folders.values()]
        .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
        .map((c) => {
          const closed = collapsed.has(c.path)
          return (
            <div key={c.path}>
              <div className="d-folder" style={{ paddingLeft: 14 + depth * 16 }} onClick={() => toggle(c.path)}>
                <span className="chev">{closed ? '▸' : '▾'}</span>📁 {c.name}
                <span className="cnt">{c.count}</span>
                <button title="Open this folder" onClick={(e) => (e.stopPropagation(), lib.setFolder(c.path))}>
                  ↗
                </button>
              </div>
              {!closed && renderNode(c, depth + 1)}
            </div>
          )
        })}
      {n.files.map((f) => row(f, depth))}
    </>
  )

  const list = <div className="d-list">{mode === 'list' ? sorted.map((f) => row(f)) : renderNode(tree, 0)}</div>

  const otherSection = section !== 'library' && (
    <>
      <button className="b-back" onClick={() => setSection('library')}>
        ‹ Back to Routes
      </button>
      <div style={{ padding: '8px 16px 16px', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{section === 'trash' ? 'Trash' : 'Settings'}</h3>
        {section === 'trash' ? <TrashList lib={lib} /> : <SettingsForm />}
      </div>
    </>
  )

  const lensStrip = lens && (
    <div className="c-lens" style={phone ? { left: 8, right: 8, bottom: sheetH + 8 } : { left: 436, right: 68, bottom: 60 }}>
      <span className="lbl">
        {lens.length} Routes here{' '}
        <button onClick={() => setLens(null)} style={{ all: 'unset', cursor: 'pointer', marginLeft: 6 }}>
          ✕
        </button>
      </span>
      {lens.map((id, i) => {
        const f = lib.files.find((x) => x.id === id)!
        return (
          <button key={id} {...press(id, () => select(id))}>
            <span className="sw" style={{ background: PICKER_COLORS[i % PICKER_COLORS.length] }} />
            <span>
              <b style={{ display: 'block', fontSize: 13 }}>{f.name}</b>
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                {km(f.distanceKm)} · {f.folder || 'Library'}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )

  const syncAction = () => (sync.running ? sync.setOpen(true) : sync.start())
  const controls = (
    <div className="b-controls" style={phone ? { top: 'calc(10px + env(safe-area-inset-top))' } : undefined}>
      <button className="b-ctl" title={sync.running ? 'Sync running: show progress' : 'Sync Now'} onClick={syncAction}>
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
              <input type="checkbox" checked readOnly /> <span style={{ color: ACCENT }}>━</span> Routes
            </label>
            <label>
              <input type="checkbox" checked={lib.showRideHistory} onChange={(e) => lib.setShowRideHistory(e.target.checked)} /> <span style={{ color: RIDE_HISTORY_COLOR }}>━</span> Ride History
            </label>
          </div>
        )}
      </div>
      <button className="b-ctl" title="Trash" onClick={() => setSection('trash')}>
        🗑{lib.trash.length > 0 && <span className="a-badge">{lib.trash.length}</span>}
      </button>
      <button className="b-ctl" title="Settings" onClick={() => setSection('settings')}>
        ⚙
      </button>
    </div>
  )

  // Sync: B's dark card, but full height on the right (C's side sheet), next to the map controls.
  const syncCard = sync.open && sync.state && (
    <div className="d-sync" style={phone ? { left: 8, right: 8, top: 8, bottom: 'auto', width: 'auto', maxHeight: '80vh' } : undefined}>
      <div className="b-sync-head">
        <SyncIcon spinning={sync.running} />
        <b>{sync.running ? 'Loading and processing data…' : 'Sync finished'}</b>
      </div>
      <div style={{ overflow: 'auto', flex: 1, display: 'grid', gap: 16, alignContent: 'start', marginTop: 14 }}>
        <SyncLoaded state={sync.state} />
        <SyncProcessing state={sync.state} />
        <SyncProblems state={sync.state} />
      </div>
      <button className="d-sync-close" onClick={() => sync.setOpen(false)}>
        Close{sync.running ? ' (Sync keeps running)' : ''}
      </button>
    </div>
  )

  const map = (
    <MapView
      files={lib.visible}
      showRideHistory={lib.showRideHistory}
      selectedId={lib.selectedId}
      hoverId={lib.hoverId}
      candidateColors={lensColors}
      onPick={onPick}
      styleName="liberty"
      accent={ACCENT}
      padding={phone ? { bottom: sheetH + (lens ? 90 : 20) } : { left: 430, bottom: lens ? 120 : 40 }}
    />
  )

  if (phone) {
    return (
      <div className="b-root">
        {map}
        {controls}
        {lensStrip}
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
              if (!moved) return setSheetH(snaps[sheetH >= snaps[2] - 5 ? 0 : sheetH >= snaps[1] - 5 ? 2 : 1])
              setSheetH(snaps.reduce((b, s) => (Math.abs(s - sheetH) < Math.abs(b - sheetH) ? s : b), snaps[0]))
            }}
          >
            <div className="grab" />
          </div>
          {section === 'library' ? (
            <>
              {head}
              <div className="scroll">{list}</div>
            </>
          ) : (
            <div className="scroll">{otherSection}</div>
          )}
        </div>
        {syncCard}
      </div>
    )
  }

  return (
    <div className="b-root">
      {map}
      <div className="d-panel">
        {section === 'library' ? (
          <>
            {head}
            {list}
          </>
        ) : (
          otherSection
        )}
      </div>
      {controls}
      {lensStrip}
      {syncCard}
    </div>
  )
}
