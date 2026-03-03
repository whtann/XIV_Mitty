"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fs = require("fs");
const Store = require("electron-store");
const store = new Store({
  name: "xiv-mitty-config",
  defaults: {
    jobs: [],
    skills: []
  }
});
function registerIpcHandlers() {
  electron.ipcMain.handle("store:getConfig", () => {
    return {
      jobs: store.get("jobs"),
      skills: store.get("skills")
    };
  });
  electron.ipcMain.handle("store:setConfig", (_event, config) => {
    store.set("jobs", config.jobs);
    store.set("skills", config.skills);
  });
  electron.ipcMain.handle("file:open", async () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await electron.dialog.showOpenDialog(win, {
      title: "Open Fight Plan",
      filters: [{ name: "XIV Mitty Plan", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, "utf-8");
    return { filePath, content };
  });
  electron.ipcMain.handle("file:save", async (_event, { filePath, content }) => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (!win) return null;
    let targetPath = filePath;
    if (!targetPath) {
      const result = await electron.dialog.showSaveDialog(win, {
        title: "Save Fight Plan",
        defaultPath: "fight-plan.json",
        filters: [{ name: "XIV Mitty Plan", extensions: ["json"] }]
      });
      if (result.canceled || !result.filePath) return null;
      targetPath = result.filePath;
    }
    fs.writeFileSync(targetPath, content, "utf-8");
    return targetPath;
  });
  electron.ipcMain.handle("file:saveAs", async (_event, content) => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await electron.dialog.showSaveDialog(win, {
      title: "Save Fight Plan As",
      defaultPath: "fight-plan.json",
      filters: [{ name: "XIV Mitty Plan", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, content, "utf-8");
    return result.filePath;
  });
  electron.ipcMain.handle("image:pick", async () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await electron.dialog.showOpenDialog(win, {
      title: "Select Icon Image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
      properties: ["openFile"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const data = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${data.toString("base64")}`;
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    backgroundColor: "#1a1a2e",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.xivmitty.app");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  registerIpcHandlers();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
