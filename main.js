const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const QRCode = require('qrcode');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f1a',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC: Open file dialog for Excel/CSV
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Spreadsheet', extensions: ['xlsx', 'xls', 'csv'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return data;
});

// IPC: Generate QR Code as data URL
ipcMain.handle('generate-qrcode', async (event, text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
});

// IPC: Print — optimized for Intermec barcode printer (4in x 2in labels)
ipcMain.handle('print-page', async () => {
  const printWindow = BrowserWindow.getFocusedWindow();
  if (printWindow) {
    printWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: {
        width: 101600,   // 101.6mm in microns (4 inches)
        height: 50800,   // 50.8mm in microns (2 inches)
      },
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });
  }
});
