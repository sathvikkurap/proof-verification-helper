const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let frontendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Proof Verification Helper',
  });

  // Start backend server
  startBackend();

  // Wait for backend, then load frontend
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 3000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, '../../backend');
  const isDev = !app.isPackaged;

  if (isDev) {
    // Development: use npm run dev
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      shell: true,
    });
  } else {
    // Production: use compiled version
    backendProcess = spawn('node', ['dist/index.js'], {
      cwd: backendPath,
      shell: true,
    });
  }

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });
}

function startFrontend() {
  const frontendPath = path.join(__dirname, '../../frontend');
  const isDev = !app.isPackaged;

  if (isDev) {
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      shell: true,
    });
  } else {
    // Production: serve built files
    frontendProcess = spawn('npx', ['serve', '-s', 'dist', '-l', '3000'], {
      cwd: frontendPath,
      shell: true,
    });
  }

  frontendProcess.stdout.on('data', (data) => {
    console.log(`Frontend: ${data}`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
});

