import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { extname } from 'path'
import Store from 'electron-store'

interface AppConfig {
  jobs: unknown[]
  skills: unknown[]
}

const store = new Store<AppConfig>({
  name: 'xiv-mitty-config',
  defaults: {
    jobs: [],
    skills: []
  }
})

export function registerIpcHandlers(): void {
  // ── Config (skill/job library) ──────────────────────────────────────────
  ipcMain.handle('store:getConfig', () => {
    return {
      jobs: store.get('jobs'),
      skills: store.get('skills')
    }
  })

  ipcMain.handle('store:setConfig', (_event, config: AppConfig) => {
    store.set('jobs', config.jobs)
    store.set('skills', config.skills)
  })

  // ── Fight plan file I/O ─────────────────────────────────────────────────
  ipcMain.handle('file:open', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: 'Open Fight Plan',
      filters: [{ name: 'XIV Mitty Plan', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const content = readFileSync(filePath, 'utf-8')
    return { filePath, content }
  })

  ipcMain.handle('file:save', async (_event, { filePath, content }: { filePath: string | null; content: string }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    let targetPath = filePath

    if (!targetPath) {
      const result = await dialog.showSaveDialog(win, {
        title: 'Save Fight Plan',
        defaultPath: 'fight-plan.json',
        filters: [{ name: 'XIV Mitty Plan', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePath) return null
      targetPath = result.filePath
    }

    writeFileSync(targetPath, content, 'utf-8')
    return targetPath
  })

  ipcMain.handle('file:saveAs', async (_event, content: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Fight Plan As',
      defaultPath: 'fight-plan.json',
      filters: [{ name: 'XIV Mitty Plan', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) return null

    writeFileSync(result.filePath, content, 'utf-8')
    return result.filePath
  })

  // ── Image picker ────────────────────────────────────────────────────────────
  ipcMain.handle('image:pick', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: 'Select Icon Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const ext = extname(filePath).slice(1).toLowerCase()
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
    const data = readFileSync(filePath)
    return `data:${mimeType};base64,${data.toString('base64')}`
  })
}
