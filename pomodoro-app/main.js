const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, nativeTheme } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    frame: false,
    transparent: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTrayIcon() {
  // Minimal 16x16 red square PNG (base64)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABYSURBVDiNY/z//z8DMwMDAwMTE5DBQAMGkBowMDAwMDIyMTMxMTIxMTIyMzExMjIxMTEyMzAxMjIxMjIxMDIyMDIxMzIxMDIwMDAyMjIyMDIxMDIwMDIyAgAwHhIJeLFj1AAAAABJRU5ErkJggg==',
    'base64'
  );
  return nativeImage.createFromBuffer(png, { width: 16, height: 16 });
}

function createTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('番茄时钟');

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

// IPC handlers
ipcMain.handle('store:get', (_, key, defaultValue) => store.get(key, defaultValue));
ipcMain.handle('store:set', (_, key, value) => store.set(key, value));
ipcMain.handle('store:delete', (_, key) => store.delete(key));

ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:close', () => mainWindow.close());

ipcMain.handle('app:setAutoLaunch', (_, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
});

ipcMain.handle('app:getAutoLaunch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('app:getTheme', () => {
  return store.get('theme', 'dark');
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
