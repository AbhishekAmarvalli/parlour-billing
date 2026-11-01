import { useEffect, useState } from 'react'
import { hasPin, isLocked, lockWaitLeft, setPin, verifyPin } from './pin'
import { BackspaceIcon, LockIcon } from '../../ui/icons'
import { db } from '../../data/db'

interface Props {
  onUnlock: () => void
}

type Mode = 'set' | 'confirm' | 'enter'

/** PIN lock screen. First run makes a PIN; after that it opens the app. PRD F1. */
export default function PinScreen({ onUnlock }: Props) {
  const [mode, setMode] = useState<Mode>(() => (hasPin() ? 'enter' : 'set'))
  const [pin, setPinTyped] = useState('')
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState('')
  const [waitLeft, setWaitLeft] = useState(() => (isLocked() ? lockWaitLeft() : 0))
  const [parlourName, setParlourName] = useState('Parlour Admin')

  useEffect(() => {
    db.settings.toCollection().first().then((s) => {
      if (s?.parlour_name) setParlourName(s.parlour_name)
    })
  }, [])

  // Ticks down the 30 second wait after 3 wrong tries.
  useEffect(() => {
    if (waitLeft <= 0) return
    const timer = window.setInterval(() => setWaitLeft(Math.max(0, lockWaitLeft())), 500)
    return () => window.clearInterval(timer)
  }, [waitLeft])

  const locked = waitLeft > 0

  function press(digit: string) {
    if (locked || pin.length >= 4) return
    const next = pin + digit
    setPinTyped(next)
    if (next.length === 4) submit(next)
  }

  function backspace() {
    setPinTyped((p) => p.slice(0, -1))
    setMessage('')
  }

  function submit(value: string) {
    if (mode === 'set') {
      setPending(value)
      setPinTyped('')
      setMessage('')
      // Ask for the PIN a second time so a typo does not lock her out.
      setTimeout(() => setMode('confirm'), 0)
      return
    }
    if (mode === 'confirm') {
      if (value === pending) {
        setPin(value)
        onUnlock()
      } else {
        setPinTyped('')
        setPending('')
        setMessage('The two PINs did not match. Make one again')
        setTimeout(() => setMode('set'), 0)
      }
      return
    }
    if (verifyPin(value)) {
      onUnlock()
    } else {
      setPinTyped('')
      if (isLocked()) {
        setWaitLeft(lockWaitLeft())
        setMessage('')
      } else {
        setMessage('Wrong PIN. Try again')
      }
    }
  }

  const title =
    mode === 'set' ? 'Make a 4 number PIN' : mode === 'confirm' ? 'Type the same PIN again' : parlourName
  const subtitle =
    mode === 'set' ? 'You will need it to open the app' : mode === 'confirm' ? 'Type it once more' : 'Type your 4 number PIN'

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-between bg-ink px-6 py-10 text-white">
      <div className="flex flex-col items-center pt-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg text-ink">
          <LockIcon className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-center text-base font-semibold text-soft">{subtitle}</p>

        <div className="mt-8 flex gap-4" aria-label="PIN entered" role="status">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 border-white ${i < pin.length ? 'bg-white' : ''}`}
            />
          ))}
        </div>

        <p className="mt-4 min-h-6 text-center text-sm font-bold text-soft" role="alert">
          {locked ? `Wait ${waitLeft} seconds before trying again` : message}
        </p>
      </div>

      <div className="grid w-full max-w-80 grid-cols-3 gap-3" onContextMenu={(e) => e.preventDefault()}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            aria-label={`Digit ${d}`}
            onClick={() => press(d)}
            disabled={locked}
            className="min-h-16 rounded-full bg-white/15 text-2xl font-extrabold text-white active:bg-white/30 disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <span aria-hidden="true" />
        <button
          type="button"
          aria-label="Digit 0"
          onClick={() => press('0')}
          disabled={locked}
          className="min-h-16 rounded-full bg-white/15 text-2xl font-extrabold text-white active:bg-white/30 disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          aria-label="Delete last digit"
          onClick={backspace}
          disabled={locked || pin.length === 0}
          className="flex min-h-16 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/30 disabled:opacity-40"
        >
          <BackspaceIcon className="h-7 w-7" />
        </button>
      </div>
    </div>
  )
}
