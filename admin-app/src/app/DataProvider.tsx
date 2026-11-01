// Loads the phone database once after unlock and hands it to the screens.
// reload() re-reads everything — every write path (save, cancel, settings,
// backup) awaits it so the screens always show the latest data.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadAll, type LoadedData } from '../data/repo'

interface DataState extends LoadedData {
  loading: boolean
  reload: () => Promise<void>
}

const DataCtx = createContext<DataState | null>(null)

const EMPTY: LoadedData = { services: [], customers: [], bills: [], items: [] }

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ ...EMPTY, loading: true, reload: async () => {} })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const data = await loadAll()
      setState({ ...data, loading: false, reload })
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return <DataCtx.Provider value={state}>{children}</DataCtx.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
