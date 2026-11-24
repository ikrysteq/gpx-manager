// PROTOTYPE Variant C, "Rail + inline": no header; a dark icon rail on the left (Library, Trash, Settings,
// Layers, Sync). Folders as breadcrumbs instead of a tree; list rows show the Route's shape and expand inline
// into the file panel. Overlap picker = "colour lens": candidate Routes get distinct colours with matching chips
// along the bottom of the map. Sync = full-height side sheet. Phone: app bar with List|Map segmented control,
// ⋯ menu, and a full-screen file page.
import { useMemo, useState } from 'react'
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

export function VariantC({ lib, sync, phone }: VariantProps) {
  const [section, setSection] = useState<'library' | 'trash' | 'settings'>('library')
  const [lens, setLens] = useState<string[] | null>(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>('dateAdded')
  const [desc, setDesc] = useState(true)
  const [phoneView, setPhoneView] = useState<'list' | 'map'>('map')
  const [phonePage, setPhonePage] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const press = usePressHighlight(lib.setHoverId)

  const sorted = useMemo(() => {
    const s = [...lib.visible].sort((a, b) => (a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : 0))
    return desc ? s.reverse() : s
  }, [lib.visible, sort, desc])

  const lensColors = lens ? Object.fromEntries(lens.map((id, i) => [id, PICKER_COLORS[i % PICKER_COLORS.length]])) : null

  const select = (id: string | null) => {
    lib.setSelectedId(id)
    setLens(null)
    if (id && phone) setPhonePage(true)
    if (id && !phone) setTimeout(() => document.getElementById(`c-item-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50)
  }
  const onPick = (e: PickEvent) => {
    if (e.ids.length === 1) select(e.ids[0])
    else if (e.ids.length > 1) setLens(e.ids)
    else select(null)
  }

  const crumbs = lib.folder ? lib.folder.split('/') : []
  const children = folders.filter((f) => (lib.folder ? f.startsWith(lib.folder + '/') : true) && f.split('/').length === crumbs.length + 1)

  const actions = (f: GpxFile) => (
    <div className="acts">
      <button className="primary" onClick={() => shareOrDownload(f)}>
        ⤴ Share / Download GPX
      </button>
      {(f.identicalGroup || f.similarGroup) && <button onClick={() => lib.showDuplicates(f, f.identicalGroup ? 'identical' : 'similar')}>⧉ Show duplicates</button>}
      <button className="danger" onClick={() => (lib.deleteFile(f.id), setPhonePage(false))}>
        🗑 Delete
      </button>
    </div>
  )
  const facts = (f: GpxFile) => (
    <div className="facts">
      <span>Folder</span>
      <span>{f.folder || 'Library'}</span>
      <span>File</span>
      <span style={{ wordBreak: 'break-all' }}>{f.fileName}</span>
      <span>Source</span>
      <span>{f.source}</span>
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
  )

  const listHead = (
    <div className="c-colhead">
      <div className="c-crumbs">
        <button onClick={() => lib.setFolder('')} style={{ fontWeight: crumbs.length ? 400 : 700 }}>
          📚 Library
        </button>
        {crumbs.map((c, i) => (
          <span key={i}>
            ›
            <button onClick={() => lib.setFolder(crumbs.slice(0, i + 1).join('/'))} style={{ fontWeight: i === crumbs.length - 1 ? 700 : 400 }}>
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
      <input type="search" placeholder="Search name or file name" value={lib.search} onChange={(e) => lib.setSearch(e.target.value)} />
      <div className="c-tools">
        <span>Sort</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {SORTS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <button onClick={() => setDesc((d) => !d)} style={{ border: '1px solid #e2dbd0', background: '#fff', borderRadius: 6 }}>
          {desc ? '↓' : '↑'}
        </button>
        <label style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={lib.duplicatesOnly} onChange={(e) => lib.setDuplicatesOnly(e.target.checked)} /> Duplicates only
        </label>
      </div>
      {lib.dupFilter && (
        <div style={{ background: '#ede9fe', borderRadius: 8, padding: '4px 10px', fontSize: 12, display: 'flex' }}>
          {lib.dupFilter.label}
          <button onClick={() => lib.setDupFilter(null)} style={{ marginLeft: 'auto', border: 0, background: 'none' }}>
            ✕
          </button>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#7a6f66' }}>{sorted.length} GPX Files</div>
    </div>
  )

  const list = (
    <div className="c-list">
      {sorted.map((f) => {
        const open = !phone && f.id === lib.selectedId
        return (
          <div key={f.id} id={`c-item-${f.id}`} className={`c-item ${open ? 'open' : ''}`} onMouseEnter={() => lib.setHoverId(f.id)} onMouseLeave={() => lib.setHoverId(null)}>
            <div className="row" onClick={() => select(open ? null : f.id)}>
              <RouteThumb coords={f.coords} size={44} color={open ? '#0e7490' : '#8a5a2b'} />
              <div style={{ minWidth: 0 }}>
                <div className="name">
                  {f.name} <DupIcons f={f} size={13} onClick={(k) => lib.showDuplicates(f, k)} />
                </div>
                <div className="sub">
                  {f.folder || 'Library'} · {f.source}
                </div>
              </div>
              <div className="big">
                <b>{km(f.distanceKm)}</b>
                <span className="sub">↑ {metres(f.elevationGainM)}</span>
              </div>
            </div>
            {open && (
              <div className="c-expand">
                {facts(f)}
                {actions(f)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const lensStrip = lens && (
    <div className="c-lens" style={phone ? { bottom: 'calc(60px + env(safe-area-inset-bottom))' } : undefined}>
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

  const map = (
    <MapView files={lib.visible} showRideHistory={lib.showRideHistory} selectedId={lib.selectedId} hoverId={lib.hoverId} candidateColors={lensColors} onPick={onPick} accent="#0e7490" styleName="positron" padding={lens ? { bottom: 120 } : undefined} />
  )

  const syncSheet = sync.open && sync.state && (
    <div className="c-sidesheet">
      <header>
        <SyncIcon spinning={sync.running} size={20} />
        {sync.running ? 'Loading and processing data…' : 'Sync finished'}
      </header>
      <div className="content">
        <SyncLoaded state={sync.state} />
        <SyncProcessing state={sync.state} />
        <SyncProblems state={sync.state} />
      </div>
      <footer>
        <button onClick={() => sync.setOpen(false)}>Close{sync.running ? ' (Sync keeps running)' : ''}</button>
      </footer>
    </div>
  )

  const layerToggle = (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="checkbox" checked={lib.showRideHistory} onChange={(e) => lib.setShowRideHistory(e.target.checked)} />
      <span style={{ color: RIDE_HISTORY_COLOR }}>━</span> Ride History
    </label>
  )
  const syncAction = () => (sync.running ? sync.setOpen(true) : sync.start())

  if (phone) {
    const sel = lib.selected
    return (
      <div className="c-root" style={{ flexDirection: 'column' }}>
        <div className="c-appbar">
          <button className="ib" onClick={syncAction} title="Sync">
            <SyncIcon spinning={sync.running} />
          </button>
          <div className="c-seg">
            <button className={phoneView === 'list' ? 'on' : ''} onClick={() => setPhoneView('list')}>
              List
            </button>
            <button className={phoneView === 'map' ? 'on' : ''} onClick={() => setPhoneView('map')}>
              Map
            </button>
          </div>
          <button className="ib" onClick={() => setMenuOpen((o) => !o)}>
            ⋯{lib.trash.length > 0 && <span className="a-badge" style={{ position: 'absolute', top: -2, right: -4 }}>{lib.trash.length}</span>}
          </button>
          {menuOpen && (
            <div className="c-menu" onClick={() => setMenuOpen(false)}>
              <button onClick={syncAction}>⟳ Sync Now</button>
              <label onClick={(e) => e.stopPropagation()}>{layerToggle}</label>
              <button onClick={() => setSection('trash')}>🗑 Trash ({lib.trash.length})</button>
              <button onClick={() => setSection('settings')}>⚙ Settings</button>
            </div>
          )}
        </div>
        {/* Filter shared by both views: compact summary row */}
        <div style={{ display: phoneView === 'list' ? 'contents' : 'none' }}>
          {listHead}
          {list}
        </div>
        <div style={{ flex: 1, position: 'relative', display: phoneView === 'map' ? 'block' : 'none' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 3, background: '#fffc', borderRadius: 8, padding: '6px 10px', fontSize: 12 }} onClick={() => setPhoneView('list')}>
            📚 {lib.folder || 'Library'} {lib.search && `· “${lib.search}”`} {lib.duplicatesOnly && '· duplicates'} {lib.dupFilter && `· ${lib.dupFilter.label}`} · {lib.visible.length} Routes <span style={{ float: 'right', color: '#c2410c' }}>Filter ›</span>
          </div>
          {map}
          {lensStrip}
        </div>
        {phonePage && sel && (
          <div className="c-fullpage">
            <div className="c-appbar">
              <button className="ib" onClick={() => setPhonePage(false)}>
                ‹
              </button>
              <b style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.name}</b>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: 16, background: '#fff' }}>
              <RouteThumb coords={sel.coords} size={180} color="#0e7490" />
            </div>
            <div className="c-expand" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <b style={{ fontSize: 22 }}>{sel.distanceKm.toFixed(1)}</b> km
                </div>
                <div>
                  <b style={{ fontSize: 22 }}>{sel.elevationGainM}</b> m ↑
                </div>
              </div>
              {facts(sel)}
              {actions(sel)}
              <button onClick={() => (setPhonePage(false), setPhoneView('map'))} style={{ border: 0, background: 'none', color: '#c2410c', textAlign: 'left', padding: 0 }}>
                ⌖ Show on map
              </button>
            </div>
          </div>
        )}
        {section !== 'library' && (
          <div className="c-fullpage">
            <div className="c-appbar">
              <button className="ib" onClick={() => setSection('library')}>
                ‹
              </button>
              <b>{section === 'trash' ? 'Trash' : 'Settings'}</b>
            </div>
            <div className="c-page">{section === 'trash' ? <TrashList lib={lib} /> : <SettingsForm />}</div>
          </div>
        )}
        {syncSheet}
      </div>
    )
  }

  return (
    <div className="c-root">
      <nav className="c-rail">
        <button className={section === 'library' ? 'on' : ''} onClick={() => setSection('library')}>
          <span className="ic">📚</span>Library
        </button>
        <button className={section === 'trash' ? 'on' : ''} onClick={() => setSection('trash')}>
          <span className="ic">🗑</span>Trash
          {lib.trash.length > 0 && <span className="a-badge">{lib.trash.length}</span>}
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setLayersOpen((o) => !o)}>
            <span className="ic">◫</span>Layers
          </button>
          {layersOpen && <div className="c-layerpop" style={{ top: 0 }}>{layerToggle}</div>}
        </div>
        <span style={{ flex: 1 }} />
        <button onClick={syncAction} className={sync.running ? 'on' : ''}>
          <span className="ic">
            <SyncIcon spinning={sync.running} size={20} />
          </span>
          {sync.running ? 'Syncing' : 'Sync'}
        </button>
        <button className={section === 'settings' ? 'on' : ''} onClick={() => setSection('settings')}>
          <span className="ic">⚙</span>Settings
        </button>
      </nav>
      <div className="c-col">
        {section === 'library' ? (
          <>
            {listHead}
            {list}
          </>
        ) : (
          <div className="c-page">
            <h2 style={{ marginTop: 0 }}>{section === 'trash' ? 'Trash' : 'Settings'}</h2>
            {section === 'trash' ? <TrashList lib={lib} /> : <SettingsForm />}
          </div>
        )}
      </div>
      <div className="c-map">
        {map}
        {lensStrip}
      </div>
      {syncSheet}
    </div>
  )
}
