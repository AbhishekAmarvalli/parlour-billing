// Generates the launcher icons: a plum rounded square with a white bill/receipt
// and a rose "total" line. Run from the repo root: node android/tools/make-icon.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const resDir = join(here, '..', 'app', 'src', 'main', 'res')

const PLUM = [0x4a, 0x1d, 0x3d, 255]
const WHITE = [0xff, 0xff, 0xff, 255]
const ROSE = [0xb8, 0x3a, 0x62, 255]
const CLEAR = [0, 0, 0, 0]

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** True when (x, y) sits inside a rounded rectangle. */
function inRoundedRect(x, y, left, top, w, h, r) {
  if (x < left || y < top || x >= left + w || y >= top + h) return false
  const cx = Math.min(Math.max(x, left + r), left + w - 1 - r)
  const cy = Math.min(Math.max(y, top + r), top + h - 1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

function makeIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const set = (x, y, rgba) => {
    const i = (y * size + x) * 4
    pixels[i] = rgba[0]
    pixels[i + 1] = rgba[1]
    pixels[i + 2] = rgba[2]
    pixels[i + 3] = rgba[3]
  }

  const bgRadius = Math.round(size * 0.22)
  const receipt = {
    left: Math.round(size * 0.27),
    top: Math.round(size * 0.16),
    w: Math.round(size * 0.46),
    h: Math.round(size * 0.68),
    r: Math.round(size * 0.05),
  }
  // Three text lines inside the bill.
  const lineX = Math.round(size * 0.34)
  const lineW = Math.round(size * 0.32)
  const lineH = Math.max(2, Math.round(size * 0.045))
  const lines = [0.3, 0.42, 0.54].map((f) => Math.round(size * f))
  // The rose "total" bar.
  const totalY = Math.round(size * 0.68)
  const totalH = Math.max(3, Math.round(size * 0.055))

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inRoundedRect(x, y, 0, 0, size, size, bgRadius)) {
        set(x, y, CLEAR)
        continue
      }
      if (!inRoundedRect(x, y, receipt.left, receipt.top, receipt.w, receipt.h, receipt.r)) {
        set(x, y, PLUM)
        continue
      }
      const onLine = lines.some((ly) => y >= ly && y < ly + lineH && x >= lineX && x < lineX + lineW)
      const onTotal = y >= totalY && y < totalY + totalH && x >= lineX && x < lineX + lineW
      if (onTotal) set(x, y, ROSE)
      else if (onLine) set(x, y, PLUM)
      else set(x, y, WHITE)
    }
  }
  return png(size, size, pixels)
}

const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
for (const [density, size] of Object.entries(densities)) {
  const dir = join(resDir, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ic_launcher.png'), makeIcon(size))
  console.log(`wrote mipmap-${density}/ic_launcher.png (${size}x${size})`)
}
