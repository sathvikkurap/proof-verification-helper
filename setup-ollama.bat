@echo off
REM Automatic Ollama Setup Script for Proof Verification Helper (Windows)
REM This script automatically installs and configures Ollama with the recommended model

echo ╔══════════════════════════════════════════════════════════════╗
echo ║            Setting up Ollama for AI-Powered Proofs          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo Checking for Ollama installation...

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Ollama is already installed
    goto :check_running
)

echo Ollama not found. Please install Ollama manually:
echo.
echo 1. Download from: https://ollama.ai/download
echo 2. Install the Windows version
echo 3. Run this script again
echo.
echo Press any key to open the download page...
pause >nul
start https://ollama.ai/download
exit /b 1

:check_running
echo Checking if Ollama is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Ollama is running
    goto :setup_model
)

echo Starting Ollama...
start /B ollama serve
timeout /t 5 /nobreak >nul

REM Check again if it's running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to start Ollama automatically
    echo Please start Ollama manually by running: ollama serve
    echo Then run this script again
    pause
    exit /b 1
)

:setup_model
echo Setting up AI model: llama3.2
echo This may take a few minutes...

ollama pull llama3.2
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to download model
    echo You can try again later with: ollama pull llama3.2
    goto :create_env
)

echo ✓ Model downloaded successfully!

:create_env
if exist "backend\.env" (
    echo ✓ Environment file already exists
) else (
    echo Creating environment configuration...
    (
        echo PORT=5001
        echo JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%
        echo NODE_ENV=production
        echo OLLAMA_ENABLED=true
        echo OLLAMA_BASE_URL=http://localhost:11434
        echo OLLAMA_MODEL=llama3.2
    ) > backend\.env
    echo ✓ Created backend\.env
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Setup Complete!                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎉 Ollama is now ready to provide AI-powered proof suggestions!
echo.
echo The system will automatically use the local LLM for enhanced AI
echo suggestions. If Ollama isn't available, it falls back to the
echo rule-based system.
echo.
echo You can now run the application normally.
echo.
pause
