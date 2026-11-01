// Saves files from the web app to the phone's Download folder through the
// Java bridge (MainActivity.saveFile). On a desktop browser it falls back to a
// normal download, so the exports can be tried during development.

interface AndroidBridge {
  saveFile(name: string, base64: string): void
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge
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
