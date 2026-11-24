// PROTOTYPE (throwaway): three radically different layouts for gpx-manager, switchable via `?variant=A|B|C`
// and the pink floating bar (or ← / →). Library, filter, selection, Trash and the fake Sync live here, above
// the variants, so switching keeps state. Add `&syncFail=1` to see a failed Ride History step.
// Question: what should the UI look like? (layout, file panel, overlap picker, Sync dialog, header). See issue #1.
import { useState } from 'react'
import './prototype.css'
import { useFakeSync } from './fakeSync'
import { useLibrary } from './useLibrary'
import { PrototypeSwitcher, type VariantMeta } from './PrototypeSwitcher'
import { useIsPhone } from './shared'
import { VariantA } from './variants/VariantA'
import { VariantB } from './variants/VariantB'
import { VariantC } from './variants/VariantC'
import { VariantD } from './variants/VariantD'

const VARIANTS: VariantMeta[] = [
  { key: 'A', name: 'Workbench' },
  { key: 'B', name: 'Map-first' },
  { key: 'C', name: 'Rail + inline' },
  { key: 'D', name: 'B look + C function' },
]

export function PrototypeApp() {
  const [variant, setVariant] = useState(() => new URLSearchParams(location.search).get('variant') ?? 'A')
  const lib = useLibrary()
  const sync = useFakeSync()
  const phone = useIsPhone()

  const change = (k: string) => {
    const p = new URLSearchParams(location.search)
    p.set('variant', k)
    history.replaceState(null, '', `?${p}`)
    lib.setHoverId(null)
    setVariant(k)
  }

  const props = { lib, sync, phone }
  return (
    <>
      {variant === 'A' && <VariantA key="A" {...props} />}
      {variant === 'B' && <VariantB key="B" {...props} />}
      {variant === 'C' && <VariantC key="C" {...props} />}
      {variant === 'D' && <VariantD key="D" {...props} />}
      <PrototypeSwitcher
        variants={VARIANTS}
        current={variant}
        onChange={change}
        debug={{
          variant,
          phone,
          filter: { folder: lib.folder || '(Library)', search: lib.search, duplicatesOnly: lib.duplicatesOnly, dupFilter: lib.dupFilter?.label ?? null },
          visible: lib.visible.length,
          selected: lib.selected?.name ?? null,
          hover: lib.hoverId,
          rideHistory: lib.showRideHistory,
          trash: lib.trash.map((t) => t.originalPath),
          sync: { running: sync.running, dialogOpen: sync.open, failMode: sync.fail },
        }}
      />
    </>
  )
}

export interface VariantProps {
  lib: ReturnType<typeof useLibrary>
  sync: ReturnType<typeof useFakeSync>
  phone: boolean
}
