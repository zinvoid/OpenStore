const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('openstore', {
  isDesktop: true,
  platform: process.platform,
  version: () => ipcRenderer.invoke('os:version'),
  list: () => ipcRenderer.invoke('os:list'),
  install: (payload) => ipcRenderer.invoke('os:install', payload),
  launch: (slug) => ipcRenderer.invoke('os:launch', slug),
  reveal: (slug) => ipcRenderer.invoke('os:reveal', slug),
  uninstall: (slug) => ipcRenderer.invoke('os:uninstall', slug),
  chooseFolder: (slug) => ipcRenderer.invoke('os:chooseFolder', slug),
  move: (slug, target) => ipcRenderer.invoke('os:move', { slug, target }),
  detect: (payload) => ipcRenderer.invoke('os:detect', payload),
  apply: (payload) => ipcRenderer.invoke('os:apply', payload),
  security: () => ipcRenderer.invoke('os:security'),
  scan: (slug) => ipcRenderer.invoke('os:scan', { slug }),
  update: (payload) => ipcRenderer.invoke('os:update', payload),
  windowControl: (action) => ipcRenderer.invoke('os:window-control', action),
  openExternal: (url) => ipcRenderer.invoke('os:openExternal', url),
  onProgress: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('os:progress', handler)
    return () => ipcRenderer.removeListener('os:progress', handler)
  },
  onUpdateProgress: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('os:update-progress', handler)
    return () => ipcRenderer.removeListener('os:update-progress', handler)
  },
})
