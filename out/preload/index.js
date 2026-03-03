"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const api = {
  store: {
    getConfig: () => electron.ipcRenderer.invoke("store:getConfig"),
    setConfig: (config) => electron.ipcRenderer.invoke("store:setConfig", config)
  },
  file: {
    open: () => electron.ipcRenderer.invoke("file:open"),
    save: (filePath, content) => electron.ipcRenderer.invoke("file:save", { filePath, content }),
    saveAs: (content) => electron.ipcRenderer.invoke("file:saveAs", content)
  },
  image: {
    pick: () => electron.ipcRenderer.invoke("image:pick")
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
exports.api = api;
