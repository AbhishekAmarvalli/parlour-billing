// A WhatsApp share ("Share → Parlour Admin") lands here: pull the shared text,
// read the contact out of it and open New Bill with name and number filled in.
// The data is pulled (not pushed) so a share that arrives while the PIN screen
// is up still opens the bill after the owner unlocks.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setSharedTextNudge, takeSharedText } from './androidBridge'
import { parseSharedContact } from '../domain/phone'
import { stashSharedContact } from '../features/bill/draftStore'

export default function SharedContactBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    function apply() {
      const raw = takeSharedText()
      if (!raw) return
      const contact = parseSharedContact(raw)
      if (!contact) return
      stashSharedContact(contact)
      navigate('/new-bill')
    }

    apply() // a share made before or during unlock
    return setSharedTextNudge(apply) // a share made while the app is open
  }, [navigate])

  return null
}
