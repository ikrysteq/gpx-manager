// PROTOTYPE Variant A, "Workbench": classic three-pane desktop (tree | sortable table | map).
// File panel docked on the map's right edge; overlap picker = popover at the pointer; Sync = centred modal;
// header bar holds everything. Phone: filter row + List/Map bottom tabs, bottom sheets for panel and picker.
import { useMemo, useState, type ReactNode } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import type { VariantProps } from '../PrototypeApp'
import { folders, type GpxFile } from '../fakeData'
import { MapView, RIDE_HISTORY_COLOR, type PickEvent } from '../MapView'
import { DupIcons, km, metres, SettingsForm, shareOrDownload, SyncIcon, SyncLoaded, SyncProblems, SyncProcessing, TrashList, usePressHighlight } from '../shared'

const col = createColumnHelper<GpxFile>()

function Modal({ title, icon, onClose, children, footer }: { title: string; icon?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="a-modal-bg" onClick={onClose}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          {icon}
          {title}
          <span className="a-spacer" />
          <button onClick={onClose} style={{ border: 0, background: 'none', fontSize: 18 }}>
            ✕
          </button>
        </header>
        <div className="content">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export function VariantA({ lib, sync, phone }: VariantProps) {
  const [picker, setPicker] = useState<PickEvent | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [modal, setModal] = useState<'trash' | 'settings' | null>(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [tab, setTab] = useState<'list' | 'map'>('list')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const press = usePressHighlight(lib.setHoverId)

  const select = (id: string) => {
    lib.setSelectedId(id)
    setPanelOpen(true)
    setPicker(null)
  }
  const onPick = (e: PickEvent) => {
    if (e.ids.length === 1) select(e.ids[0])
    else if (e.ids.length > 1) setPicker(e)
    else {
      setPicker(null)
      setPanelOpen(false)
      lib.setSelectedId(null)
    }
  }

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Name', cell: (c) => c.getValue() }),
      col.accessor('folder', { header: 'Folder', cell: (c) => <span style={{ opacity: 0.7 }}>{c.getValue() || '—'}</span> }),
      col.accessor('distanceKm', { header: 'km', cell: (c) => c.getValue().toFixed(1), meta: 'num' }),
      col.accessor('elevationGainM', { header: '↑ m', cell: (c) => c.getValue(), meta: 'num' }),
      col.accessor('source', { header: 'Source' }),
      col.accessor('dateAdded', { header: 'Added' }),
      col.display({ id: 'dup', header: 'Dup', cell: (c) => <DupIcons f={c.row.original} onClick={(k) => lib.showDuplicates(c.row.original, k)} /> }),
    ],
    [lib],
  )
  const table = useReactTable({ data: lib.visible, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  const sel = lib.selected
  const pickerFiles = picker ? picker.ids.map((id) => lib.files.find((f) => f.id === id)!).filter(Boolean) : []

  const filePanelBody = sel && (
    <>
      <h3>{sel.name}</h3>
      <dl className="a-facts">
        <dt>Folder</dt>
        <dd>{sel.folder || 'Library'}</dd>
        <dt>File</dt>
        <dd style={{ wordBreak: 'break-all' }}>{sel.fileName}</dd>
        <dt>Distance</dt>
        <dd>{km(sel.distanceKm)}</dd>
        <dt>Elevation</dt>
        <dd>{metres(sel.elevationGainM)}</dd>
        <dt>Source</dt>
        <dd>{sel.source}</dd>
        <dt>Duplicates</dt>
        <dd>{sel.identicalGroup || sel.similarGroup || sel.multiRoute ? <DupIcons f={sel} onClick={(k) => lib.showDuplicates(sel, k)} /> : 'none'}</dd>
      </dl>
      <div className="a-actions">
        <button className="primary" onClick={() => shareOrDownload(sel)}>
          ⤴ Share / Download GPX
        </button>
        {(sel.identicalGroup || sel.similarGroup) && <button onClick={() => lib.showDuplicates(sel, sel.identicalGroup ? 'identical' : 'similar')}>⧉ Show duplicates</button>}
        <button className="danger" onClick={() => (lib.deleteFile(sel.id), setPanelOpen(false))}>
          🗑 Delete (move to Trash)
        </button>
      </div>
    </>
  )

  const pickerList = (
    <>
      <div className="t">{pickerFiles.length} Routes here</div>
      {pickerFiles.map((f) => (
        <div key={f.id} className="it" {...press(f.id, () => select(f.id))}>
          <span>
            {f.name} <DupIcons f={f} size={12} />
          </span>
          <span style={{ opacity: 0.6 }}>{km(f.distanceKm)}</span>
        </div>
      ))}
    </>
  )

  const layersBtn = (
    <span style={{ position: 'relative' }}>
      <button className="a-ibtn" onClick={() => setLayersOpen((o) => !o)} title="Layers">
        ◫ {phone ? '' : 'Layers'}
      </button>
      {layersOpen && (
        <div className="a-layers">
          <b>Layers</b>
          <label>
            <input type="checkbox" checked readOnly /> <span style={{ color: '#2f6fde' }}>━</span> Routes
          </label>
          <label>
            <input type="checkbox" checked={lib.showRideHistory} onChange={(e) => lib.setShowRideHistory(e.target.checked)} /> <span style={{ color: RIDE_HISTORY_COLOR }}>━</span> Ride History
          </label>
        </div>
      )}
    </span>
  )

  const headerIcons = (
    <>
      {layersBtn}
      <button className="a-ibtn" onClick={() => (sync.running ? sync.setOpen(true) : sync.start())} title={sync.running ? 'Sync running: show progress' : 'Sync Now'}>
        <SyncIcon spinning={sync.running} /> {phone ? '' : sync.running ? 'Syncing…' : 'Sync Now'}
      </button>
      <button className="a-ibtn" onClick={() => setModal('trash')} title="Trash">
        🗑 {phone ? '' : 'Trash'} {lib.trash.length > 0 && <span className="a-badge">{lib.trash.length}</span>}
      </button>
      <button className="a-ibtn" onClick={() => setModal('settings')} title="Settings">
        ⚙
      </button>
    </>
  )

  const dupChip = lib.dupFilter && (
    <span className="a-chip">
      {lib.dupFilter.label}
      <button onClick={() => lib.setDupFilter(null)}>✕</button>
    </span>
  )

  const map = (
    <MapView
      files={lib.visible}
      showRideHistory={lib.showRideHistory}
      selectedId={lib.selectedId}
      hoverId={lib.hoverId}
      onPick={onPick}
      padding={!phone && panelOpen ? { right: 330 } : phone && panelOpen ? { bottom: 280 } : undefined}
    />
  )

  const modals = (
    <>
      {sync.open && sync.state && (
        <Modal
          title={sync.running ? 'Loading and processing data…' : 'Sync finished'}
          icon={<SyncIcon spinning={sync.running} size={20} />}
          onClose={() => sync.setOpen(false)}
          footer={<button onClick={() => sync.setOpen(false)}>Close</button>}
        >
          <div className="a-sync-grid">
            <SyncLoaded state={sync.state} />
            <SyncProcessing state={sync.state} />
          </div>
          <SyncProblems state={sync.state} />
        </Modal>
      )}
      {modal === 'trash' && (
        <Modal title="Trash" onClose={() => setModal(null)}>
          <TrashList lib={lib} />
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Settings" onClose={() => setModal(null)}>
          <SettingsForm />
        </Modal>
      )}
    </>
  )

  if (phone) {
    return (
      <div className="a-root">
        <div className="a-header">
          <span className="a-logo">GPX</span>
          <span className="a-spacer" />
          {headerIcons}
        </div>
        <div className="a-phone-filter">
          <select value={lib.folder} onChange={(e) => lib.setFolder(e.target.value)} style={{ flex: '1 1 40%' }}>
            <option value="">Library (all)</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {'  '.repeat(f.split('/').length - 1)}
                {f.split('/').pop()}
              </option>
            ))}
          </select>
          <input type="search" placeholder="Search" value={lib.search} onChange={(e) => lib.setSearch(e.target.value)} style={{ flex: '1 1 40%' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <input type="checkbox" checked={lib.duplicatesOnly} onChange={(e) => lib.setDuplicatesOnly(e.target.checked)} /> Duplicates only
          </label>
          {dupChip}
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto', display: tab === 'list' ? 'block' : 'none' }}>
            {lib.visible.map((f) => (
              <div key={f.id} className={`a-mrow ${f.id === lib.selectedId ? 'sel' : ''}`} onClick={() => (select(f.id), setTab('map'))}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {f.name} <DupIcons f={f} size={13} onClick={(k) => lib.showDuplicates(f, k)} />
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>
                    {f.folder || 'Library'} · {f.source}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div>{km(f.distanceKm)}</div>
                  <div style={{ opacity: 0.6 }}>↑ {f.elevationGainM} m</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: tab === 'map' ? 'block' : 'none' }}>{map}</div>
        </div>
        <div className="a-tabs">
          <button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>
            ☰ List ({lib.visible.length})
          </button>
          <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}>
            ⌖ Map
          </button>
        </div>
        {tab === 'map' && picker && (
          <div className="a-sheet a-popover" style={{ position: 'fixed' }}>
            <div className="grab" />
            {pickerList}
            <p style={{ fontSize: 11, opacity: 0.6, padding: '0 12px' }}>Long-press to highlight, tap to open.</p>
          </div>
        )}
        {tab === 'map' && panelOpen && sel && !picker && (
          <div className="a-sheet">
            <div className="grab" />
            <button onClick={() => setPanelOpen(false)} style={{ float: 'right', border: 0, background: 'none', fontSize: 18 }}>
              ✕
            </button>
            <div style={{ display: 'grid', gap: 10 }}>{filePanelBody}</div>
          </div>
        )}
        {modals}
      </div>
    )
  }

  return (
    <div className="a-root">
      <div className="a-header">
        <span className="a-logo">gpx-manager</span>
        <input type="search" placeholder="Search GPX Files…" value={lib.search} onChange={(e) => lib.setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={lib.duplicatesOnly} onChange={(e) => lib.setDuplicatesOnly(e.target.checked)} /> Duplicates only
        </label>
        {dupChip}
        <span className="a-spacer" />
        {headerIcons}
      </div>
      <div className="a-body">
        <div className="a-tree">
          <div className={lib.folder === '' ? 'on' : ''} onClick={() => lib.setFolder('')}>
            📚 Library <span style={{ opacity: 0.5 }}>({lib.files.length})</span>
          </div>
          {folders.map((f) => (
            <div key={f} className={lib.folder === f ? 'on' : ''} style={{ paddingLeft: 12 + 14 * f.split('/').length }} onClick={() => lib.setFolder(f)}>
              📁 {f.split('/').pop()} <span style={{ opacity: 0.5 }}>({lib.files.filter((x) => x.folder === f || x.folder.startsWith(f + '/')).length})</span>
            </div>
          ))}
        </div>
        <div className="a-list">
          <table>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} onClick={h.column.getToggleSortingHandler()} className={h.column.columnDef.meta === 'num' ? 'num' : ''}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((r) => (
                <tr key={r.id} className={r.original.id === lib.selectedId ? 'sel' : ''} onClick={() => select(r.original.id)} onMouseEnter={() => lib.setHoverId(r.original.id)} onMouseLeave={() => lib.setHoverId(null)}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className={c.column.id === 'name' ? 'name' : c.column.columnDef.meta === 'num' ? 'num' : ''}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 8, fontSize: 12, opacity: 0.6 }}>{lib.visible.length} GPX Files</div>
        </div>
        <div className="a-mapwrap">
          {map}
          {picker && (
            <div className="a-popover" style={{ left: Math.min(picker.point.x + 8, 9999), top: picker.point.y + 8 }}>
              {pickerList}
            </div>
          )}
          {panelOpen && sel && (
            <div className="a-panel">
              <button onClick={() => setPanelOpen(false)} style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'none', fontSize: 16 }}>
                ✕
              </button>
              {filePanelBody}
            </div>
          )}
        </div>
      </div>
      {modals}
    </div>
  )
}
