// Generates the launcher icons (plum square, three white bars) into the mipmap folders.
// Run from the repo root: node android/tools/make-icon.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const resDir = join(here, '..', 'app', 'src', 'main', 'res')

const PLUM = [0x4a, 0x1d, 0x3d, 255]
const WHITE = [0xff, 0xff, 0xff, 255]

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

function roundedRectPixel(x, y, left, top, w, h, r) {
  if (x < left || y < top || x >= left + w || y >= top + h) return false
  const cx = Math.min(Math.max(x, left + r), left + w - 1 - r)
  const cy = Math.min(Math.max(y, top + r), top + h - 1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

function makeIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const radius = Math.round(size * 0.22)
  const set = (x, y, rgba) => {
    const i = (y * size + x) * 4
    pixels[i] = rgba[0]
    pixels[i + 1] = rgba[1]
    pixels[i + 2] = rgba[2]
    pixels[i + 3] = rgba[3]
  }
  const barHeights = [0.32, 0.52, 0.4]
  const barTop = 0.24
  const gap = size * 0.07
  const barW = (size - 4 * gap) / 3
  const barRadius = Math.max(1, Math.round(size * 0.03))

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!roundedRectPixel(x, y, 0, 0, size, size, radius)) {
        set(x, y, [0, 0, 0, 0])
        continue
      }
      let color = PLUM
      for (let b = 0; b < 3; b++) {
        const left = Math.round(gap + b * (barW + gap))
        const h = Math.round(size * barHeights[b])
        const top = Math.round(size * barTop + (size * 0.5 - h))
        if (roundedRectPixel(x, y, left, top, Math.round(barW), h, barRadius)) color = WHITE
      }
      set(x, y, color)
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
