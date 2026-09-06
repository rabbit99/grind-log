const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("grindLogNative", {
  save: (text) => ipcRenderer.invoke("file:save", text),
  open: () => ipcRenderer.invoke("file:open"),
  onMenu: (fn) => {
    ipcRenderer.on("menu:open", () => fn("open"));
    ipcRenderer.on("menu:save", () => fn("save"));
  },
});
