#!/usr/bin/env node

/**
 * Cross-platform Ollama setup script
 * Automatically detects OS and runs the appropriate setup script
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function detectOS() {
  const platform = process.platform;
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  if (platform === 'win32') return 'windows';
  return 'unknown';
}

function runSetup() {
  const os = detectOS();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║            Setting up Ollama for AI-Powered Proofs          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nDetected OS: ${os}\n`);

  const scriptPath = os === 'windows'
    ? path.join(__dirname, 'setup-ollama.bat')
    : path.join(__dirname, 'setup-ollama.sh');

  if (!fs.existsSync(scriptPath)) {
    console.log('⚠️  Setup script not found. AI suggestions will use fallback mode.');
    console.log('You can manually run the setup later.');
    return;
  }

  try {
    if (os === 'windows') {
      // Run batch file
      execSync(`"${scriptPath}"`, { stdio: 'inherit' });
    } else {
      // Make script executable and run
      try {
        fs.chmodSync(scriptPath, '755');
      } catch (e) {
        // Ignore chmod errors on some systems
      }

      // Run the shell script
      execSync(`"${scriptPath}"`, { stdio: 'inherit' });
    }
  } catch (error) {
    console.log('⚠️  Automatic Ollama setup failed, but that\'s OK!');
    console.log('The application will work with rule-based AI suggestions.');
    console.log('You can set up Ollama later for enhanced AI features.');
  }
}

if (require.main === module) {
  runSetup();
}

module.exports = { runSetup };
