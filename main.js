const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 760,
    backgroundColor: "#131820",
    title: "練功記錄",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "index.html"));
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "檔案",
      submenu: [
        {
          label: "開啟…",
          accelerator: "CmdOrCtrl+O",
          click: () => win && win.webContents.send("menu:open"),
        },
        {
          label: "另存新檔…",
          accelerator: "CmdOrCtrl+S",
          click: () => win && win.webContents.send("menu:save"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "檢視",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "說明",
      submenu: [
        {
          label: "資料格式說明",
          click: () => shell.openPath(path.join(__dirname, "FORMAT.md")),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle("file:save", async (_e, text) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "儲存記錄",
    defaultPath: `grind-log-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "Grind Log JSON", extensions: ["json"] }],
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  try {
    await fs.writeFile(filePath, text, "utf8");
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("file:open", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "開啟記錄",
    properties: ["openFile"],
    filters: [{ name: "Grind Log JSON", extensions: ["json"] }],
  });
  if (canceled || !filePaths.length) return { ok: false, canceled: true };
  try {
    const text = await fs.readFile(filePaths[0], "utf8");
    return { ok: true, text, path: filePaths[0] };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  buildMenu();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
