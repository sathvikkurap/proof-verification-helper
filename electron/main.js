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
    title: 'Proof Verification Helper',
    show: false, // Don't show until ready
  });

  // Show loading message
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proof Verification Helper</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .loading {
          text-align: center;
        }
        .spinner {
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loading">
        <div class="spinner"></div>
        <h2>Starting Proof Verification Helper...</h2>
        <p>Please wait while we start the application</p>
      </div>
    </body>
    </html>
  `));

  // Start backend server
  startBackend();

  // Wait for backend, then load frontend
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max
  
  const checkBackend = setInterval(() => {
    attempts++;
    fetch('http://localhost:5000/api/health')
      .then(() => {
        clearInterval(checkBackend);
        // Backend is ready, now start frontend
        startFrontend();
        // Wait a bit for frontend, then load
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:3000');
          mainWindow.show();
        }, 3000);
      })
      .catch(() => {
        if (attempts >= maxAttempts) {
          clearInterval(checkBackend);
          mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h2>⚠️ Could not start backend server</h2>
              <p>Please check that ports 3000 and 5000 are available.</p>
              <p>Try restarting the application.</p>
            </body>
            </html>
          `));
          mainWindow.show();
        }
      });
  }, 1000);

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
      stdio: 'ignore',
    });
  } else {
    // Production: serve built files
    const distPath = path.join(frontendPath, 'dist');
    if (fs.existsSync(distPath)) {
      frontendProcess = spawn('npx', ['serve', '-s', 'dist', '-l', '3000'], {
        cwd: frontendPath,
        shell: true,
        stdio: 'ignore',
      });
    } else {
      console.error('Frontend dist folder not found. Please build first.');
    }
  }
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

