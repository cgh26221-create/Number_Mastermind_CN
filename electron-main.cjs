const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    title: "Number Mastermind AI",
    backgroundColor: '#E4E3E0',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 隐藏默认菜单栏
  win.setMenuBarVisibility(false);

  // 加载打包后的 index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath).catch(err => {
    console.error('Failed to load index.html:', err);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
