const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    generateQRCode: (text) => ipcRenderer.invoke('generate-qrcode', text),
    printPage: () => ipcRenderer.invoke('print-page'),
});
