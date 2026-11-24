// PROTOTYPE: in-memory Library state shared by every variant (filter, selection, Trash). No persistence.
import { useMemo, useState } from 'react'
import { initialFiles, type GpxFile } from './fakeData'

export interface TrashEntry {
  file: GpxFile
  originalPath: string
  deletedAt: string
}

export interface DupFilter {
  kind: 'identical' | 'similar'
  group: string
  label: string
}

export function useLibrary() {
  const [files, setFiles] = useState<GpxFile[]>(initialFiles)
  const [trash, setTrash] = useState<TrashEntry[]>([])
  const [folder, setFolder] = useState('') // '' = whole Library
  const [search, setSearch] = useState('')
  const [duplicatesOnly, setDuplicatesOnly] = useState(false)
  const [dupFilter, setDupFilter] = useState<DupFilter | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [showRideHistory, setShowRideHistory] = useState(true)

  // Duplicate flags recomputed from what is still in the Library (resolved groups lose their icons).
  const withFlags = useMemo(() => {
    const count = (key: 'identicalGroup' | 'similarGroup', g?: string) => (g ? files.filter((f) => f[key] === g).length : 0)
    return files.map((f) => ({
      ...f,
      identicalGroup: count('identicalGroup', f.identicalGroup) > 1 ? f.identicalGroup : undefined,
      similarGroup: count('similarGroup', f.similarGroup) > 1 ? f.similarGroup : undefined,
    }))
  }, [files])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return withFlags.filter((f) => {
      if (dupFilter) return dupFilter.kind === 'identical' ? f.identicalGroup === dupFilter.group : f.similarGroup === dupFilter.group
      if (folder && !(f.folder === folder || f.folder.startsWith(folder + '/'))) return false
      if (q && !f.name.toLowerCase().includes(q) && !f.fileName.toLowerCase().includes(q)) return false
      if (duplicatesOnly && !f.identicalGroup && !f.similarGroup) return false
      return true
    })
  }, [withFlags, folder, search, duplicatesOnly, dupFilter])

  const selected = withFlags.find((f) => f.id === selectedId) ?? null

  function deleteFile(id: string) {
    const f = files.find((x) => x.id === id)
    if (!f) return
    setFiles((fs) => fs.filter((x) => x.id !== id))
    setTrash((t) => [{ file: f, originalPath: `${f.folder ? f.folder + '/' : ''}${f.fileName}`, deletedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }, ...t])
    if (selectedId === id) setSelectedId(null)
  }
  function restore(id: string) {
    const e = trash.find((x) => x.file.id === id)
    if (!e) return
    setTrash((t) => t.filter((x) => x.file.id !== id))
    setFiles((fs) => [...fs, e.file])
  }
  function emptyTrash() {
    if (confirm(`Permanently delete ${trash.length} GPX File(s)? This cannot be undone.`)) setTrash([])
  }
  function showDuplicates(f: GpxFile, kind: DupFilter['kind']) {
    const group = kind === 'identical' ? f.identicalGroup : f.similarGroup
    if (group) setDupFilter({ kind, group, label: `${kind === 'identical' ? 'Identical' : 'Similar'} to “${f.name}”` })
  }

  return {
    files: withFlags,
    visible,
    trash,
    folder,
    setFolder: (f: string) => {
      setFolder(f)
      setDupFilter(null)
    },
    search,
    setSearch,
    duplicatesOnly,
    setDuplicatesOnly,
    dupFilter,
    setDupFilter,
    selected,
    selectedId,
    setSelectedId,
    hoverId,
    setHoverId,
    showRideHistory,
    setShowRideHistory,
    deleteFile,
    restore,
    emptyTrash,
    showDuplicates,
  }
}

export type Library = ReturnType<typeof useLibrary>
