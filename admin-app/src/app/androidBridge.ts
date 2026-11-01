// Saves files from the web app to the phone's Download folder, reads the
// clipboard and opens the phone's contact picker — all through the Java bridge
// (MainActivity.AndroidBridge). On a desktop browser these are simply absent.

export interface PickedContact {
  name: string
  phone: string
}

interface AndroidBridge {
  saveFile(name: string, base64: string): void
  pickContact?: () => void
  readClipboard?: () => string
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge
    __onContactPicked?: (contact: PickedContact) => void
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Write a file to the phone (Download folder) or the browser's downloads. */
export function saveFile(name: string, bytes: Uint8Array): 'phone' | 'browser' {
  const bridge = window.AndroidBridge
  if (bridge?.saveFile) {
    bridge.saveFile(name, toBase64(bytes))
    return 'phone'
  }
  const blob = new Blob([bytes as BlobPart])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'browser'
}

/** True when the Android contact picker and clipboard are available. */
export function canPickContact(): boolean {
  return Boolean(window.AndroidBridge?.pickContact && window.AndroidBridge?.readClipboard)
}

/** Open the phone's contact picker (the same numbers WhatsApp uses). */
export function openContactPicker(): void {
  window.AndroidBridge?.pickContact?.()
}

/** Read what is currently on the clipboard, or null when unavailable. */
export function readClipboardText(): string | null {
  try {
    const text = window.AndroidBridge?.readClipboard?.()
    return text ?? null
  } catch {
    return null
  }
}

/**
 * Register the handler the Java bridge calls after a contact is chosen.
 * Returns a cleanup function.
 */
export function setContactPickerHandler(handler: (contact: PickedContact) => void): () => void {
  window.__onContactPicked = handler
  return () => {
    if (window.__onContactPicked === handler) delete window.__onContactPicked
  }
}
