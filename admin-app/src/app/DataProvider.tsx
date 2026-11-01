// Loads the phone database once after unlock and hands it to the screens.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadAll, type LoadedData } from '../data/repo'

interface DataState extends LoadedData {
  loading: boolean
  reload: () => void
}

const DataCtx = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    services: [],
    customers: [],
    bills: [],
    items: [],
    loading: true,
    reload: () => {},
  })

  const reload = useCallback(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    loadAll()
      .then((data) => {
        if (!cancelled) setState({ ...data, loading: false, reload })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => reload(), [reload])

  return <DataCtx.Provider value={state}>{children}</DataCtx.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
