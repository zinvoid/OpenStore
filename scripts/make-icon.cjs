// Gera a logo da OpenStore em PNG com fundo transparente (sem bordas brancas).
// uso: npx electron scripts/make-icon.cjs
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')

const SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 32 32'>
  <defs>
    <linearGradient id='bag-body' x1='6' y1='12' x2='27' y2='30' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#f8f4ff'/><stop offset='0.45' stop-color='#cbb2ff'/><stop offset='1' stop-color='#7c3aed'/>
    </linearGradient>
    <linearGradient id='bag-handle' x1='11' y1='5' x2='22' y2='14' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#f4ecff'/><stop offset='1' stop-color='#9b7bff'/>
    </linearGradient>
  </defs>
  <path d='M11.6 13.6v-2.2a4.4 4.4 0 0 1 8.8 0v2.2' fill='none' stroke='url(#bag-handle)' stroke-width='2.2' stroke-linecap='round'/>
  <path d='M7.4 12.6h17.2c1.7 0 3 1.3 3 3v9.9c0 2-1.6 3.6-3.6 3.6H8c-2 0-3.6-1.6-3.6-3.6v-9.9c0-1.7 1.3-3 3-3Z' fill='url(#bag-body)'/>
  <path d='M7.4 13.1h6.5c-1.4 2.7-3.6 4.6-7.1 5.5a2.1 2.1 0 0 1-1.5-.6v-2.4a2.6 2.6 0 0 1 2.1-2.5Z' fill='#ffffff' opacity='0.45'/>
  <path d='M16 15.8c-3.1 0-5.4 2.6-5.4 5.8v3.4c0 .65.75.98 1.24.57l1.16-.9a.83.83 0 0 1 1.02 0l1.1.85a1 1 0 0 0 1.2 0l1.1-.85a.83.83 0 0 1 1.02 0l1.16.9c.49.41 1.24.08 1.24-.57v-3.4c0-3.2-2.3-5.8-5.4-5.8Z' fill='#150a2e'/>
  <path d='M12.6 18.9 15.2 18.05 14.7 20.4Z' fill='#f6f2ff'/>
  <path d='M19.4 18.9 16.8 18.05 17.3 20.4Z' fill='#f6f2ff'/>
</svg>`

const SIZES = [1024, 512, 256, 128, 64, 32]

app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 600,
    height: 400,
    webPreferences: { offscreen: false, backgroundThrottling: false },
  })
  await win.loadURL('data:text/html,<html><body style="margin:0"></body></html>')

  const render = `(async () => {
    const svg = ${JSON.stringify(SVG)};
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const out = {};
    for (const size of ${JSON.stringify(SIZES)}) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      out[size] = c.toDataURL('image/png').split(',')[1];
    }
    return out;
  })()`

  const result = await win.webContents.executeJavaScript(render, true)

  const write = (file, size) => {
    const buf = Buffer.from(result[size], 'base64')
    fs.writeFileSync(file, buf)
    console.log(`ok ${path.relative(ROOT, file)} (${size}px, ${buf.length} bytes)`)
  }

  fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true })
  fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true })
  write(path.join(ROOT, 'build', 'icon.png'), 1024)
  write(path.join(ROOT, 'public', 'icon.png'), 512)
  write(path.join(ROOT, 'build', 'icon-256.png'), 256)

  app.quit()
})
