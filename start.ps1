# PaperLens Startup Script
# Starts backend (FastAPI) and frontend (Vite) in parallel

Write-Host "Starting PaperLens..." -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path ".venv")) {
    Write-Host "ERROR: Virtual environment not found. Run: python -m venv .venv" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "new_ui/node_modules")) {
    Write-Host "ERROR: Frontend dependencies not installed. Run: cd new_ui && npm install" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/2] Starting Backend (FastAPI)..." -ForegroundColor Green
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -PassThru

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend (Vite)..." -ForegroundColor Green
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\new_ui'; npm run dev" -PassThru

Write-Host "`n✓ Services started!" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop all services..." -ForegroundColor Gray

# Wait for user interrupt
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✓ All services stopped." -ForegroundColor Green
}
