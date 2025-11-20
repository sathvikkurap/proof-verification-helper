# Installation Guide - Proof Verification Helper

## For Non-Technical Users

### Easy Installation (Recommended)

#### macOS
1. Download the `.dmg` file
2. Double-click to open
3. Drag "Proof Verification Helper" to Applications
4. Open from Applications folder
5. That's it! The app will start automatically

#### Windows
1. Download the `.exe` installer
2. Double-click to run
3. Follow the installation wizard
4. Launch from Start Menu
5. Done!

#### Linux
1. Download the `.AppImage` file
2. Right-click → Properties → Make executable
3. Double-click to run
4. Or use: `./Proof-Verification-Helper.AppImage`

## What Gets Installed

- ✅ Proof Verification Helper application
- ✅ All dependencies included
- ✅ Backend server (runs automatically)
- ✅ Frontend interface (opens in window)
- ✅ Database (created automatically)

## First Launch

1. **Launch the app** - Double-click the application
2. **Wait a moment** - Backend starts automatically (5-10 seconds)
3. **App opens** - Browser window opens automatically
4. **Start using!** - No configuration needed

## Optional: Enhanced AI with Ollama

The app works great out of the box! For even better AI suggestions:

1. **Install Ollama** (optional):
   - macOS: `brew install ollama`
   - Or download from https://ollama.com
   
2. **Pull a model** (optional):
   ```bash
   ollama pull llama3.2
   ```

3. **Start Ollama** (optional):
   ```bash
   ollama serve
   ```

4. **That's it!** - The app automatically detects and uses Ollama if available

**Note:** Ollama is completely optional. The app works perfectly without it!

## Troubleshooting

### App won't start?
- Make sure you have Node.js installed (comes with the app)
- Try restarting your computer
- Check if port 3000 or 5000 is already in use

### Can't connect?
- Wait 10-15 seconds for backend to start
- Check firewall settings
- Try restarting the app

### Need help?
- Check the README.md
- Open an issue on GitHub
- The app includes helpful error messages

## System Requirements

- **macOS**: 10.13 or later
- **Windows**: Windows 10 or later
- **Linux**: Most modern distributions
- **RAM**: 4GB minimum (8GB recommended for Ollama)
- **Disk**: 500MB free space

## Uninstallation

### macOS
- Drag app from Applications to Trash
- Delete `~/Library/Application Support/proof-verification-helper`

### Windows
- Settings → Apps → Uninstall
- Or use Control Panel

### Linux
- Delete the AppImage file
- Remove `~/.config/proof-verification-helper`

