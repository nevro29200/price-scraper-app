const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    backgroundColor: '#f5f5f5',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src/frontend/login.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Dev tools en mode développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function startBackend() {
  backendProcess = spawn('node', [path.join(__dirname, 'src/backend/server.js')], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_MODE: 'true' }
  });

  backendProcess.on('error', (err) => {
    console.error('Erreur backend:', err);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Backend arrêté avec le code ${code}`);
    }
  });
}

app.whenReady().then(() => {
  startBackend();
  
  // Attendre que le backend soit prêt
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('navigate', (event, page) => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, `src/frontend/${page}.html`));
  }
});