const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Trails",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable <webview> tag for embedding websites
    },
    transparent: true,
    backgroundColor: '#00000000',
    backgroundMaterial: 'acrylic',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000', // Start transparent, let renderer update it
      symbolColor: '#ffffff',
      height: 32
    },
    autoHideMenuBar: true,
    resizable: true,
    maximizable: true,
  });

  // In development, load from localhost
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../out/index.html')}`;
  
  const load = () => {
    mainWindow.loadURL(startUrl).catch(e => {
      console.log('Error loading URL, retrying in 1s...', e);
      setTimeout(load, 1000);
    });
  };

  load();

  // IPC to update title bar overlay
  ipcMain.on('update-titlebar-overlay', (event, { color, symbolColor }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitleBarOverlay({
        color: color || '#00000000',
        symbolColor: symbolColor || '#ffffff',
        height: 32
      });
    }
  });

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers can be added here
ipcMain.on('ping', (event, arg) => {
  console.log(arg); 
});
