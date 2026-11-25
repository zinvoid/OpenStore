// Gera os ícones da OpenStore a partir de uma imagem de origem (PNG/WebP quadrada).
// Remove o fundo branco com flood fill a partir das bordas, recorta o conteúdo,
// centraliza com uma margem pequena e exporta em alta qualidade.
//
// uso: npx electron scripts/make-logo.cjs <caminho-da-imagem>
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const SRC = process.argv[2] && !process.argv[2].startsWith('-')
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'build', 'logo-source.webp')

if (!fs.existsSync(SRC)) {
  console.error(`origem não encontrada: ${SRC}`)
  process.exit(1)
}

// margem em fração do lado (7% deixa o desenho grande sem encostar na borda)
const PAD = 0.07
const OUTPUTS = [
  { file: 'build/icon.png', size: 1024 },
  { file: 'public/icon.png', size: 512 },
  { file: 'build/icon-256.png', size: 256 },
]

app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  const mime = path.extname(SRC).toLowerCase() === '.webp' ? 'image/webp' : 'image/png'
  const dataUrl = `data:${mime};base64,${fs.readFileSync(SRC).toString('base64')}`

  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 1024,
    webPreferences: { backgroundThrottling: false },
  })
  await win.loadURL('data:text/html,<html><body style="margin:0"></body></html>')

  const results = await win.webContents.executeJavaScript(`(async () => {
    const img = new Image()
    img.src = ${JSON.stringify(dataUrl)}
    await img.decode()

    const w = img.naturalWidth
    const h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0)
    const frame = ctx.getImageData(0, 0, w, h)
    const d = frame.data

    // 1) fundo branco conectado às bordas vira transparente
    const isWhite = (p) => d[p] > 236 && d[p + 1] > 236 && d[p + 2] > 236
    const removed = new Uint8Array(w * h)
    const stack = []
    const seed = (x, y) => {
      const p = y * w + x
      if (!removed[p] && isWhite(p * 4)) {
        removed[p] = 1
        stack.push(p)
      }
    }
    for (let x = 0; x < w; x += 1) { seed(x, 0); seed(x, h - 1) }
    for (let y = 0; y < h; y += 1) { seed(0, y); seed(w - 1, y) }
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p - x) / w
      if (x > 0) seed(x - 1, y)
      if (x < w - 1) seed(x + 1, y)
      if (y > 0) seed(x, y - 1)
      if (y < h - 1) seed(x, y + 1)
    }

    // 2) suaviza a borda (tira o resto de branco do antialiasing)
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const p = y * w + x
        if (removed[p]) { d[p * 4 + 3] = 0; continue }
        const nearGone =
          removed[p - 1] || removed[p + 1] || removed[p - w] || removed[p + w]
        if (!nearGone) continue
        const i = p * 4
        const light = (d[i] + d[i + 1] + d[i + 2]) / 3
        if (light > 228) d[i + 3] = 0
        else if (light > 212) d[i + 3] = Math.round(d[i + 3] * 0.45)
      }
    }
    ctx.putImageData(frame, 0, 0)

    // 3) recorte no conteúdo visível
    let minX = w, minY = h, maxX = 0, maxY = 0
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (!d[(y * w + x) * 4 + 3]) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
    if (maxX <= minX || maxY <= minY) throw new Error('nenhum conteúdo visível após remover o fundo')

    const side = Math.max(maxX - minX + 1, maxY - minY + 1)
    const sx = Math.round((minX + maxX) / 2 - side / 2)
    const sy = Math.round((minY + maxY) / 2 - side / 2)

    const render = (size) => {
      const out = document.createElement('canvas')
      out.width = size
      out.height = size
      const octx = out.getContext('2d')
      octx.imageSmoothingEnabled = true
      octx.imageSmoothingQuality = 'high'
      const pad = Math.round(size * ${PAD})
      octx.drawImage(canvas, sx, sy, side, side, pad, pad, size - pad * 2, size - pad * 2)
      return out.toDataURL('image/png')
    }

    return {
      sizes: ${JSON.stringify(OUTPUTS)},
      images: ${JSON.stringify(OUTPUTS.map((o) => o.size))}.map(render),
    }
  })()`)

  for (let i = 0; i < results.sizes.length; i += 1) {
    const { file } = results.sizes[i]
    const target = path.join(ROOT, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, Buffer.from(results.images[i].split(',')[1], 'base64'))
    console.log(`ok ${file}`)
  }

  app.quit()
})
