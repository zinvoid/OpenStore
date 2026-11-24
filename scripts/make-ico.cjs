// Gera build/icon.ico (16, 24, 32, 48, 64, 128, 256) a partir de build/icon.png.
// O Windows usa esse arquivo para o .exe, o instalador e os atalhos.
//
// uso: node scripts/make-ico.cjs
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const SOURCE = path.join(ROOT, 'build', 'icon.png')
const TARGET = path.join(ROOT, 'build', 'icon.ico')
const SIZES = [16, 24, 32, 48, 64, 128, 256]

if (!fs.existsSync(SOURCE)) {
  console.error('build/icon.png não encontrado')
  process.exit(1)
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'openstore-ico-'))
const images = SIZES.map((size) => {
  const file = path.join(tmp, `icon-${size}.png`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SOURCE, '-vf', `scale=${size}:${size}:flags=lanczos`, '-frames:v', '1', file])
  return { size, data: fs.readFileSync(file) }
})

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reservado
header.writeUInt16LE(1, 2) // tipo: ícone
header.writeUInt16LE(images.length, 4)

const entries = []
let offset = 6 + images.length * 16
for (const image of images) {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(image.size >= 256 ? 0 : image.size, 0) // largura (0 = 256)
  entry.writeUInt8(image.size >= 256 ? 0 : image.size, 1) // altura
  entry.writeUInt8(0, 2) // cores da paleta
  entry.writeUInt8(0, 3) // reservado
  entry.writeUInt16LE(1, 4) // planos
  entry.writeUInt16LE(32, 6) // bits por pixel
  entry.writeUInt32LE(image.data.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += image.data.length
  entries.push(entry)
}

fs.writeFileSync(TARGET, Buffer.concat([header, ...entries, ...images.map((image) => image.data)]))
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`ok ${path.relative(ROOT, TARGET)} (${SIZES.join(', ')} px, ${fs.statSync(TARGET).size} bytes)`)
