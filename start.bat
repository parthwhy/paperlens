@echo off
REM PaperLens Startup Script for Windows
REM Runs backend (FastAPI) and frontend (Vite) concurrently

echo.
echo ========================================
echo   Starting PaperLens
echo ========================================
echo.

REM Check if Python venv exists
if not exist ".venv\" (
    echo [WARNING] Virtual environment not found. Creating .venv...
    python -m venv .venv
    echo [SUCCESS] Virtual environment created
)

REM Activate venv
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install Python dependencies if needed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    echo [SUCCESS] Python dependencies installed
)

REM Check if node_modules exists
if not exist "new_ui\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cd new_ui
    call npm install
    cd ..
    echo [SUCCESS] Frontend dependencies installed
)

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Please create .env file with required API keys:
    echo   GROQ_API_KEY=your_key_here
    echo   OPENROUTER_API_KEY=your_key_here (optional)
    pause
    exit /b 1
)

REM Create necessary directories
if not exist "pdf_cache\" mkdir pdf_cache
if not exist "static\animations\" mkdir static\animations
if not exist "chroma_db\" mkdir chroma_db

echo [SUCCESS] Environment ready
echo.
echo ========================================
echo   Servers Starting
echo ========================================
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo ========================================
echo.

REM Start backend in new window
start "PaperLens Backend" cmd /k ".venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "PaperLens Frontend" cmd /k "cd new_ui && npm run dev"

echo.
echo [SUCCESS] Servers started in separate windows
echo.
echo To stop servers, close the terminal windows or press Ctrl+C in each
pause
