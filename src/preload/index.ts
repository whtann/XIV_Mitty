import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  store: {
    getConfig: () => ipcRenderer.invoke('store:getConfig'),
    setConfig: (config: unknown) => ipcRenderer.invoke('store:setConfig', config)
  },
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (filePath: string | null, content: string) =>
      ipcRenderer.invoke('file:save', { filePath, content }),
    saveAs: (content: string) => ipcRenderer.invoke('file:saveAs', content)
  },
  image: {
    pick: () => ipcRenderer.invoke('image:pick')
  }
}

contextBridge.exposeInMainWorld('api', api)
