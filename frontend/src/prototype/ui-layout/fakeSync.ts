// PROTOTYPE: scripted fake Sync. State is a pure function of elapsed time, so every variant sees the same run.
import { useCallback, useEffect, useRef, useState } from 'react'

export type StepStatus = 'pending' | 'running' | 'ok' | 'failed'

export interface LoadedStep {
  label: string
  status: StepStatus
  detail?: string
}
export interface ProcessingStep {
  label: string
  status: StepStatus
  progress: number
  detail?: string
}
export interface SyncState {
  running: boolean
  elapsedMs: number
  loaded: LoadedStep[]
  processing: ProcessingStep[]
  problems: string[]
}

const DURATION = 11000

const pct = (t: number, from: number, to: number) => Math.max(0, Math.min(100, Math.round(((t - from) / (to - from)) * 100)))
const st = (t: number, from: number, to: number): StepStatus => (t < from ? 'pending' : t < to ? 'running' : 'ok')

export function syncStateAt(t: number, fail: boolean): SyncState {
  const activities: LoadedStep = fail
    ? { label: 'Activities', status: t < 2500 ? 'running' : 'failed', detail: t < 2500 ? 'page 1…' : 'Statshunters: 401 Not allowed. Check the share link in Settings.' }
    : { label: 'Activities', status: st(t, 0, 2500), detail: t < 2500 ? `page ${1 + Math.floor(t / 900)} of 3…` : '1173: 3 new, 1170 from cache' }
  const lines: LoadedStep = fail
    ? { label: 'Activity lines', status: t < 2500 ? 'pending' : 'failed', detail: t < 2500 ? undefined : 'skipped: Activities failed' }
    : { label: 'Activity lines', status: st(t, 2500, 5000), detail: t < 2500 ? undefined : t < 5000 ? 'page 1 of 2…' : '731: 3 new, 728 from cache' }
  const gpx: LoadedStep = { label: 'GPX Files', status: st(t, 0, 1500), detail: t < 1500 ? 'scanning Library…' : '247: 2 new, 1 changed, 244 from cache' }
  return {
    running: t < DURATION,
    elapsedMs: t,
    loaded: [activities, lines, gpx],
    processing: [
      fail
        ? { label: 'Ride History layer', status: t < 2500 ? 'pending' : 'failed', progress: 0, detail: t < 2500 ? undefined : 'kept previous layer (1170 Activities)' }
        : { label: 'Ride History layer', status: st(t, 5000, DURATION), progress: pct(t, 5000, DURATION) },
      { label: 'Route index', status: st(t, 1500, 6000), progress: pct(t, 1500, 6000) },
      { label: 'Duplicates', status: st(t, 6000, 9000), progress: pct(t, 6000, 9000) },
    ],
    problems:
      t < 1500
        ? []
        : ['Inbox/broken_export.gpx: not valid XML (unexpected end of file at line 1)', 'Jura/old/szlak.gpx: no <trk> or <rte> points'],
  }
}

export function useFakeSync() {
  const fail = new URLSearchParams(location.search).get('syncFail') === '1'
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const booted = useRef(false)

  const state: SyncState | null = startedAt === null ? null : syncStateAt(now - startedAt, fail)
  const running = !!state?.running

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(id)
  }, [running])

  /** "Sync Now": a second request while one is running just shows the running one. */
  const start = useCallback(() => {
    setOpen(true)
    setStartedAt((s) => (s !== null && Date.now() - s < DURATION ? s : Date.now()))
    setNow(Date.now())
  }, [])

  // Startup Sync.
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    start()
  }, [start])

  return { state, running, open, setOpen, start, fail }
}

export type Sync = ReturnType<typeof useFakeSync>
