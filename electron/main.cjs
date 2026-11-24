const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const https = require('node:https')
const http = require('node:http')
const { spawn, execFile } = require('node:child_process')

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isWin = process.platform === 'win32'

// ------------------------------------------------------------------ estado

const storeFile = () => path.join(app.getPath('userData'), 'installed.json')
const appsRoot = () => path.join(process.env.LOCALAPPDATA || app.getPath('userData'), 'OpenStore', 'Apps')

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storeFile(), 'utf8')) || {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(storeFile()), { recursive: true })
  fs.writeFileSync(storeFile(), JSON.stringify(store, null, 2))
}

// ---------------------------------------------------------------- utilidades

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function safeName(name) {
  return String(name || 'arquivo')
    .replace(/[^\w.\- ]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(-90)
}

function extOf(name) {
  const lower = String(name || '').toLowerCase()
  if (lower.endsWith('.tar.gz')) return 'tar.gz'
  const m = lower.match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

// --------------------------------------------------------------- download

function download(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (target, depth = 0) => {
      const lib = target.startsWith('https:') ? https : http
      const req = lib.get(
        target,
        { headers: { 'User-Agent': 'OpenStore/1.0', Accept: '*/*' } },
        (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && depth < 6) {
            res.resume()
            return follow(new URL(res.headers.location, target).toString(), depth + 1)
          }
          if (res.statusCode !== 200) {
            res.resume()
            return reject(new Error(`O servidor respondeu ${res.statusCode} ao baixar o arquivo.`))
          }
          const total = Number(res.headers['content-length'] || 0)
          let received = 0
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          const out = fs.createWriteStream(dest)
          res.on('data', (chunk) => {
            received += chunk.length
            onProgress?.(received, total)
          })
          res.on('error', reject)
          out.on('error', reject)
          out.on('finish', () => out.close(() => resolve(dest)))
          res.pipe(out)
        },
      )
      req.on('error', reject)
      req.setTimeout(120000, () => req.destroy(new Error('O download demorou demais para responder.')))
    }
    follow(url)
  })
}

// ------------------------------------------------------------ ClamAV (local)

function clamavCandidates() {
  const list = []
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  list.push(path.join(programFiles, 'ClamAV', 'clamscan.exe'))
  list.push(path.join(programFilesX86, 'ClamAV', 'clamscan.exe'))
  list.push('/usr/bin/clamscan')
  list.push('/usr/local/bin/clamscan')
  return list
}

function clamavPath() {
  for (const candidate of clamavCandidates()) {
    try {
      if (fs.existsSync(candidate)) return candidate
    } catch {
      /* caminho inválido neste sistema */
    }
  }
  return 'clamscan'
}

/**
 * Analisa um arquivo com o ClamAV instalado na máquina.
 * Códigos de saída do clamscan: 0 limpo, 1 infectado, 2 erro.
 */
function scanFile(target) {
  return new Promise((resolve) => {
    if (!target || !fs.existsSync(target)) {
      resolve({ ok: false, available: false, verdict: 'erro', engine: 'ClamAV', output: 'Arquivo não encontrado para análise.' })
      return
    }
    execFile(
      clamavPath(),
      ['--no-summary', '--infected', '--stdout', target],
      { timeout: 5 * 60 * 1000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        const output = `${stdout || ''}${stderr || ''}`.trim()
        if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
          resolve({
            ok: true,
            available: false,
            verdict: 'indisponivel',
            engine: 'ClamAV',
            output: 'O ClamAV não está instalado nesta máquina.',
          })
          return
        }
        if (!error) {
          resolve({ ok: true, available: true, verdict: 'limpo', engine: 'ClamAV', output })
          return
        }
        if (error.code === 1) {
          resolve({ ok: true, available: true, verdict: 'infectado', engine: 'ClamAV', output })
          return
        }
        resolve({
          ok: false,
          available: true,
          verdict: 'erro',
          engine: 'ClamAV',
          output: output || error.message || 'A análise falhou.',
        })
      },
    )
  })
}

function clamavVersion() {
  return new Promise((resolve) => {
    execFile(clamavPath(), ['--version'], { timeout: 20000, windowsHide: true }, (error, stdout) => {
      resolve(error ? null : String(stdout || '').trim().split(/\r?\n/)[0])
    })
  })
}

function progressReporter(sender, slug) {
  let last = 0
  return (received, total) => {
    const now = Date.now()
    if (now - last < 120 && received !== total) return
    last = now
    sender.send('os:progress', { slug, phase: 'download', received, total })
  }
}

// ------------------------------------------------------- registro do Windows

const UNINSTALL_KEYS = [
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
]

function queryRegistry() {
  if (!isWin) return Promise.resolve('')
  return Promise.all(
    UNINSTALL_KEYS.map(
      (key) =>
        new Promise((resolve) => {
          execFile(
            'reg',
            ['query', key, '/s'],
            { maxBuffer: 32 * 1024 * 1024, windowsHide: true },
            (error, stdout) => resolve(error ? '' : stdout),
          )
        }),
    ),
  ).then((parts) => parts.join('\n'))
}

function parseRegistry(text) {
  const entries = []
  let current = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (/^HKEY_/i.test(line)) {
      current = {}
      entries.push(current)
      continue
    }
    if (!current) continue
    const match = line.match(/^([A-Za-z0-9_]+)\s+REG_[A-Z_]+\s+(.*)$/)
    if (match) current[match[1]] = match[2].trim()
  }
  return entries
    .filter((e) => e.DisplayName)
    .map((e) => ({
      displayName: e.DisplayName,
      version: e.DisplayVersion || null,
      installLocation: (e.InstallLocation || '').replace(/^"|"$/g, '').trim() || null,
      uninstallString: e.UninstallString || null,
      displayIcon: e.DisplayIcon || null,
      publisher: e.Publisher || null,
    }))
}

function scoreName(displayName, wanted) {
  const a = norm(displayName)
  const b = norm(wanted)
  if (!a || !b) return -1
  if (a === b) return 100
  if (a.startsWith(b)) return 85
  if (a.includes(b) && b.length >= 3) return 65
  return -1
}

const SKIP_DIRS = /^(node_modules|locales|resources|swiftshader|unins\d*|installer|cache)$/i
const BAD_EXE = /unins|uninstall|setup|install|update|crash|helper|vc_?redist|dotnet|crashpad/i

/** Procura o executável principal em toda a árvore da pasta, do mais raso para o mais fundo. */
async function findExe(root, wanted, maxDepth = 6) {
  if (!root) return null
  const wantedNorm = norm(wanted)
  const candidates = []
  let level = [{ dir: root, depth: 0 }]

  while (level.length) {
    const next = []
    for (const { dir, depth } of level) {
      let entries
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isFile() && /\.exe$/i.test(entry.name) && !BAD_EXE.test(entry.name)) {
          const base = norm(entry.name.replace(/\.exe$/i, ''))
          let score = 0
          if (wantedNorm && base === wantedNorm) score = 3
          else if (wantedNorm && (base.startsWith(wantedNorm) || base.includes(wantedNorm))) score = 2
          candidates.push({ file: full, score, depth, length: full.length })
        } else if (entry.isDirectory() && depth < maxDepth && !SKIP_DIRS.test(entry.name)) {
          next.push({ dir: full, depth: depth + 1 })
        }
      }
    }
    level = next
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score || a.depth - b.depth || a.length - b.length)
  return candidates[0].file
}

/** Executável registrado (ou redescoberto na pasta) de um app já instalado. */
async function resolveExe(entry) {
  if (entry.exePath && fs.existsSync(entry.exePath)) return entry.exePath
  const dirs = [entry.installDir, path.join(appsRoot(), entry.slug)].filter(Boolean)
  const seen = new Set()
  for (const dir of dirs) {
    const key = path.resolve(dir)
    if (seen.has(key)) continue
    seen.add(key)
    const found = await findExe(dir, entry.name)
    if (found) return found
  }
  return null
}

function isUnder(child, parent) {
  const rel = path.relative(path.resolve(parent), path.resolve(child))
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function exeFromDisplayIcon(icon) {
  if (!icon || !isWin) return null
  const clean = icon.replace(/^"|"$/g, '').replace(/,\s*-?\d+$/, '').trim()
  if (!/\.exe$/i.test(clean)) return null
  try {
    return fs.existsSync(clean) ? clean : null
  } catch {
    return null
  }
}

async function detectFor({ name, slug, dir }) {
  const results = []
  const seen = new Set()

  const push = (candidate) => {
    const key = norm(candidate.displayName || candidate.exePath || candidate.installLocation || '')
    if (!key || seen.has(key)) return
    seen.add(key)
    results.push(candidate)
  }

  if (isWin) {
    const registry = parseRegistry(await queryRegistry())
    for (const entry of registry) {
      const score = Math.max(scoreName(entry.displayName, name), slug ? scoreName(entry.displayName, slug) : -1)
      if (score < 65) continue
      const exePath =
        exeFromDisplayIcon(entry.displayIcon) || (await findExe(entry.installLocation, entry.displayName))
      push({ ...entry, exePath, score, source: 'registro do Windows' })
    }
  }

  const localDirs = [dir, path.join(appsRoot(), slug)].filter(Boolean)
  for (const localDir of localDirs) {
    const exePath = await findExe(localDir, name)
    if (exePath) push({ displayName: name, exePath, installLocation: localDir, source: 'pasta do OpenStore', score: 60 })
  }

  return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 6)
}

function runInstaller(file, args = []) {
  return new Promise((resolve) => {
    const child = spawn(file, args, { stdio: 'ignore', windowsHide: false })
    const timer = setTimeout(() => resolve({ timedOut: true }), 8 * 60 * 1000)
    child.on('close', () => {
      clearTimeout(timer)
      resolve({ timedOut: false })
    })
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ timedOut: false, failed: true })
    })
  })
}

function expandZip(file, dest) {
  const q = (v) => v.replace(/'/g, "''")
  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -LiteralPath '${q(file)}' -DestinationPath '${q(dest)}' -Force`],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (error, _out, stderr) => (error ? reject(new Error(stderr || 'Não foi possível extrair o arquivo .zip.')) : resolve()),
    )
  })
}

/** Lê os primeiros bytes para saber o que o arquivo realmente é. */
function sniffFile(file) {
  return new Promise((resolve) => {
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      resolve(value)
    }
    const stream = fs.createReadStream(file, { start: 0, end: 3 })
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => {
      const buf = Buffer.concat(chunks)
      if (buf[0] === 0x50 && buf[1] === 0x4b) finish('zip')
      else if (buf[0] === 0x4d && buf[1] === 0x5a) finish('exe')
      else finish(null)
    })
    stream.on('error', () => finish(null))
  })
}

/** Muitos .zip trazem uma pasta raiz só; desce até a pasta que tem os arquivos. */
async function singleFolder(dir) {
  for (let i = 0; i < 3; i += 1) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      if (entries.length === 1 && entries[0].isDirectory()) {
        dir = path.join(dir, entries[0].name)
        continue
      }
    } catch {
      /* pasta vazia */
    }
    break
  }
  return dir
}

async function copyInto(source, dest) {
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(source, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) await copyInto(from, to)
    else if (entry.isFile()) await fs.promises.copyFile(from, to)
  }
}

// ------------------------------------------------------------------ janela

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 880,
    minHeight: 640,
    backgroundColor: '#0f0f12',
    autoHideMenuBar: true,
    show: false,
    title: 'OpenStore',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const isInternal = devServerUrl ? url.startsWith(devServerUrl) : url.startsWith('file://')
    if (!isInternal) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    }
  })
}

// ---------------------------------------------------------------------- IPC

ipcMain.handle('os:version', () => app.getVersion())

ipcMain.handle('os:list', async () => {
  const store = readStore()
  let changed = false
  const list = Object.values(store)
  for (const entry of list) {
    if (entry.exePath && fs.existsSync(entry.exePath)) continue
    const found = await resolveExe(entry)
    if (found) {
      entry.exePath = found
      changed = true
    }
  }
  if (changed) writeStore(store)
  return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
})

ipcMain.handle('os:install', async (event, payload) => {
  try {
    const p = payload || {}
    if (!p.slug || !p.url) throw new Error('Faltam informações para instalar este app.')

    const store = readStore()
    const previous = store[p.slug] || null
    let workDir = p.targetDir || previous?.installDir || path.join(appsRoot(), p.slug)
    await fs.promises.mkdir(workDir, { recursive: true })

    const rawName = (() => {
      try {
        const fromUrl = decodeURIComponent(new URL(p.url).pathname.split('/').filter(Boolean).pop() || '')
        if (fromUrl) return fromUrl
      } catch {
        /* url sem caminho */
      }
      return `${p.slug}-${p.version || '1.0.0'}.${p.format || 'bin'}`
    })()
    const fileName = safeName(rawName)
    const tempFile = path.join(app.getPath('temp'), 'openstore', `${Date.now()}-${fileName}`)

    await download(p.url, tempFile, progressReporter(event.sender, p.slug))

    // Análise antivírus antes de qualquer execução: se o ClamAV achar ameaça, para aqui.
    event.sender.send('os:progress', { slug: p.slug, phase: 'scan', received: 0, total: 0 })
    const scan = await scanFile(tempFile)
    event.sender.send('os:progress', {
      slug: p.slug,
      phase: 'scan',
      received: 0,
      total: 0,
      verdict: scan.verdict,
      engine: scan.engine,
    })
    if (scan.verdict === 'infectado') {
      await fs.promises.rm(tempFile, { force: true }).catch(() => undefined)
      const hit = String(scan.output || '')
        .split(/\r?\n/)
        .filter((line) => /FOUND/i.test(line))
        .join(' ')
      throw new Error(
        `O ClamAV encontrou uma ameaça neste arquivo e a instalação foi cancelada.${hit ? ` ${hit}` : ''}`,
      )
    }

    const declared = String(p.format || '').toLowerCase().replace(/^\./, '')
    const sniffed = await sniffFile(tempFile)
    let ext = extOf(fileName) || declared
    if (!['msi', 'msix', 'appx'].includes(ext)) {
      if (sniffed === 'zip') ext = 'zip'
      else if (sniffed === 'exe') ext = 'exe'
    }
    let exePath = previous?.exePath || null
    let uninstallString = previous?.uninstallString || null
    let kind = 'arquivo'

    if (ext === 'zip') {
      kind = 'zip'
      event.sender.send('os:progress', { slug: p.slug, phase: 'extract', received: 0, total: 0 })
      const staging = path.join(app.getPath('temp'), 'openstore', `zip-${Date.now()}`)
      await expandZip(tempFile, staging)
      const root = await singleFolder(staging)
      if (isUnder(workDir, appsRoot())) {
        await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => undefined)
      }
      await copyInto(root, workDir)
      await fs.promises.rm(staging, { recursive: true, force: true }).catch(() => undefined)
      exePath = (await findExe(workDir, p.name || p.slug)) || exePath
    } else if (ext === 'msi') {
      kind = 'instalador'
      event.sender.send('os:progress', { slug: p.slug, phase: 'installer', received: 0, total: 0 })
      await runInstaller('msiexec', ['/i', tempFile, '/passive'])
    } else if (ext === 'msix' || ext === 'appx') {
      kind = 'pacote'
      event.sender.send('os:progress', { slug: p.slug, phase: 'installer', received: 0, total: 0 })
      await shell.openPath(tempFile)
    } else if (ext === 'exe') {
      if (/setup|install|instalador|setup-x64|x64-setup/i.test(fileName)) {
        kind = 'instalador'
        event.sender.send('os:progress', { slug: p.slug, phase: 'installer', received: 0, total: 0 })
        await runInstaller(tempFile)
      } else {
        kind = 'portátil'
        const dest = path.join(workDir, fileName)
        await fs.promises.copyFile(tempFile, dest)
        exePath = dest
      }
    } else {
      const dest = path.join(workDir, fileName)
      await fs.promises.copyFile(tempFile, dest)
      kind = 'arquivo'
    }

    if (!exePath) {
      event.sender.send('os:progress', { slug: p.slug, phase: 'detect', received: 0, total: 0 })
      await delay(kind === 'instalador' || kind === 'pacote' ? 2200 : 300)
      const found = await detectFor({ name: p.name, slug: p.slug, dir: workDir })
      const best = found.find((candidate) => candidate.exePath)
      if (best) {
        exePath = best.exePath
        if (best.uninstallString) uninstallString = best.uninstallString
        if (best.installLocation && fs.existsSync(best.installLocation)) workDir = best.installLocation
      }
    }

    if (!exePath) {
      exePath = (await findExe(workDir, p.name || p.slug)) || null
    }

    const now = new Date().toISOString()
    const entry = {
      slug: p.slug,
      name: p.name || p.slug,
      version: p.version || '1.0.0',
      platform: p.platform || 'windows',
      format: ext || null,
      kind,
      logoUrl: p.logoUrl || previous?.logoUrl || null,
      accent: p.accent || previous?.accent || null,
      installDir: workDir,
      exePath: exePath && fs.existsSync(exePath) ? exePath : exePath || null,
      uninstallString,
      sourceUrl: p.url,
      fileName,
      security: {
        verdict: scan.verdict,
        engine: scan.engine,
        at: now,
        detail: scan.verdict === 'indisponivel' ? 'ClamAV não instalado neste PC.' : 'Arquivo analisado antes da instalação.',
      },
      installedAt: previous?.installedAt || now,
      updatedAt: now,
    }

    store[p.slug] = entry
    writeStore(store)
    event.sender.send('os:progress', { slug: p.slug, phase: 'done', received: 0, total: 0 })
    return { ok: true, entry }
  } catch (error) {
    return { ok: false, error: error?.message || 'Falha ao instalar o app.' }
  }
})

ipcMain.handle('os:launch', async (_event, slug) => {
  try {
    const store = readStore()
    const entry = store[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')

    const exe = await resolveExe(entry)
    if (!exe) throw new Error('Não encontramos o executável deste app. Use “Buscar automaticamente”.')
    if (entry.exePath !== exe) {
      entry.exePath = exe
      writeStore(store)
    }

    const problem = await shell.openPath(exe)
    if (problem) throw new Error(problem)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível abrir o app.' }
  }
})

ipcMain.handle('os:reveal', async (_event, slug) => {
  try {
    const entry = readStore()[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')
    if (entry.exePath && fs.existsSync(entry.exePath)) {
      shell.showItemInFolder(entry.exePath)
      return { ok: true }
    }
    if (entry.installDir && fs.existsSync(entry.installDir)) {
      await shell.openPath(entry.installDir)
      return { ok: true }
    }
    throw new Error('A pasta deste app não existe mais.')
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível abrir a pasta.' }
  }
})

ipcMain.handle('os:chooseFolder', async (_event, slug) => {
  const entry = readStore()[slug]
  const result = await dialog.showOpenDialog({
    title: 'Escolha a nova pasta de instalação',
    defaultPath: entry?.installDir ? path.dirname(entry.installDir) : appsRoot(),
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Mover para cá',
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('os:move', async (_event, payload) => {
  try {
    const { slug, target } = payload || {}
    const store = readStore()
    const entry = store[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')
    if (!target) throw new Error('Escolha uma pasta de destino.')
    if (!entry.installDir) throw new Error('Este app não tem uma pasta gerenciada pela OpenStore.')

    const oldDir = path.resolve(entry.installDir)
    const chosen = path.resolve(target)
    if (chosen === oldDir || isUnder(chosen, oldDir)) {
      throw new Error('Escolha uma pasta fora da pasta atual do app para onde mover.')
    }

    const dest = path.join(chosen, path.basename(oldDir))
    if (path.resolve(dest) === oldDir) return { ok: true, entry }

    await fs.promises.mkdir(chosen, { recursive: true })
    if (fs.existsSync(dest)) throw new Error('Já existe uma pasta com esse nome no destino.')

    await fs.promises.cp(oldDir, dest, { recursive: true, force: false })
    entry.installDir = dest
    if (entry.exePath && entry.exePath.startsWith(oldDir)) {
      entry.exePath = entry.exePath.replace(oldDir, dest)
    }
    entry.updatedAt = new Date().toISOString()
    store[slug] = entry
    writeStore(store)

    try {
      if (fs.existsSync(oldDir)) await shell.trashItem(oldDir)
    } catch {
      /* se não der para remover, o app já está funcionando no novo local */
    }
    return { ok: true, entry }
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível mover o app.' }
  }
})

ipcMain.handle('os:uninstall', async (_event, slug) => {
  try {
    const store = readStore()
    const entry = store[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')

    if (entry.uninstallString && isWin) {
      spawn('cmd.exe', ['/c', entry.uninstallString], { detached: true, stdio: 'ignore', windowsHide: false }).unref()
    } else if (entry.installDir && fs.existsSync(entry.installDir)) {
      await shell.trashItem(entry.installDir)
    }

    delete store[slug]
    writeStore(store)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível desinstalar o app.' }
  }
})

ipcMain.handle('os:detect', async (_event, payload) => {
  try {
    const p = payload || {}
    const entry = readStore()[p.slug]
    const found = await detectFor({ name: p.name || entry?.name, slug: p.slug, dir: entry?.installDir })
    return { ok: true, results: found }
  } catch (error) {
    return { ok: false, error: error?.message || 'A busca automática falhou.', results: [] }
  }
})

ipcMain.handle('os:apply', async (_event, payload) => {
  try {
    const { slug, candidate } = payload || {}
    const store = readStore()
    const entry = store[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')
    if (!candidate) throw new Error('Nenhum resultado selecionado.')

    if (candidate.exePath) entry.exePath = candidate.exePath
    if (candidate.installLocation) entry.installDir = candidate.installLocation
    if (candidate.uninstallString) entry.uninstallString = candidate.uninstallString
    if (candidate.version) entry.version = candidate.version
    entry.updatedAt = new Date().toISOString()
    store[slug] = entry
    writeStore(store)
    return { ok: true, entry }
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível aplicar o resultado.' }
  }
})

ipcMain.handle('os:openExternal', async (_event, url) => {
  if (/^https?:\/\//i.test(url || '')) await shell.openExternal(url)
  return { ok: true }
})

// ------------------------------------------------------- ClamAV + atualização

ipcMain.handle('os:security', async () => {
  const version = await clamavVersion()
  return { clamav: { available: Boolean(version), version, path: version ? clamavPath() : null } }
})

ipcMain.handle('os:scan', async (_event, payload) => {
  try {
    const slug = payload?.slug
    const store = readStore()
    const entry = store[slug]
    if (!entry) throw new Error('Este app não está registrado na OpenStore.')

    const exe = await resolveExe(entry)
    if (!exe) throw new Error('Não encontramos o executável deste app para analisar.')

    const result = await scanFile(exe)
    entry.security = {
      verdict: result.verdict,
      engine: result.engine,
      at: new Date().toISOString(),
      detail: result.verdict === 'indisponivel' ? 'ClamAV não instalado neste PC.' : String(result.output || '').slice(0, 300),
    }
    store[slug] = entry
    writeStore(store)
    return { ...result, entry }
  } catch (error) {
    return { ok: false, available: false, verdict: 'erro', engine: 'ClamAV', output: error?.message || 'A análise falhou.' }
  }
})

ipcMain.handle('os:update', async (event, payload) => {
  try {
    const url = String(payload?.url || '')
    if (!/^https?:\/\//i.test(url)) throw new Error('Endereço de atualização inválido.')

    let fileName = 'OpenStore-Setup.exe'
    try {
      const fromUrl = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '')
      if (fromUrl) fileName = fromUrl
    } catch {
      /* mantém o nome padrão */
    }

    const dest = path.join(app.getPath('temp'), 'openstore', `update-${Date.now()}-${safeName(fileName)}`)
    let last = 0
    event.sender.send('os:update-progress', { phase: 'download', received: 0, total: 0 })
    await download(url, dest, (received, total) => {
      const now = Date.now()
      if (now - last < 150 && received !== total) return
      last = now
      event.sender.send('os:update-progress', { phase: 'download', received, total })
    })

    event.sender.send('os:update-progress', { phase: 'launch', received: 0, total: 0 })
    const child = spawn(dest, [], { detached: true, stdio: 'ignore', windowsHide: false })
    child.unref()
    setTimeout(() => app.quit(), 1500)
    return { ok: true, file: dest }
  } catch (error) {
    return { ok: false, error: error?.message || 'Não foi possível baixar a atualização.' }
  }
})

// ------------------------------------------------------------------- boot

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
