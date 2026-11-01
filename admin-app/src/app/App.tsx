import { useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DataProvider } from './DataProvider'
import BottomNav from './BottomNav'
import SharedContactBridge from './SharedContactBridge'
import PinScreen from '../features/pin/PinScreen'
import HomeScreen from '../features/home/HomeScreen'
import LogScreen from '../features/log/LogScreen'
import BillScreen from '../features/log/BillScreen'
import ReportsScreen from '../features/reports/ReportsScreen'
import NewBillScreen from '../features/bill/NewBillScreen'
import CheckBillScreen from '../features/bill/CheckBillScreen'
import SettingsScreen from '../features/settings/SettingsScreen'

/** Auto-lock after 5 minutes of not touching the phone. PRD F1. */
const IDLE_MS = 5 * 60 * 1000

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const lastActive = useRef(Date.now())

  useEffect(() => {
    if (!unlocked) return
    lastActive.current = Date.now()
    const touch = () => {
      lastActive.current = Date.now()
    }
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown']
    events.forEach((e) => window.addEventListener(e, touch))
    const timer = window.setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_MS) setUnlocked(false)
    }, 20_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch))
      window.clearInterval(timer)
    }
  }, [unlocked])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg">
      {!unlocked ? (
        <PinScreen onUnlock={() => setUnlocked(true)} />
      ) : (
        <HashRouter>
          <SharedContactBridge />
          <DataProvider>
            <main className="flex-1 px-5 pt-5 pb-28">
              <Routes>
                <Route path="/" element={<HomeScreen onLock={() => setUnlocked(false)} />} />
                <Route path="/new-bill" element={<NewBillScreen />} />
                <Route path="/check-bill" element={<CheckBillScreen />} />
                <Route path="/log" element={<LogScreen />} />
                <Route path="/bill/:id" element={<BillScreen />} />
                <Route path="/reports" element={<ReportsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <BottomNav />
          </DataProvider>
        </HashRouter>
      )}
    </div>
  )
}
