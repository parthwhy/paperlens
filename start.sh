#!/bin/bash

# PaperLens Startup Script
# Runs backend (FastAPI) and frontend (Vite) concurrently

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting PaperLens...${NC}"

# Check if Python venv exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating .venv...${NC}"
    python -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate venv
echo -e "${YELLOW}📦 Activating virtual environment...${NC}"
source .venv/Scripts/activate

# Install Python dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}📥 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
fi

# Check if node_modules exists
if [ ! -d "new_ui/node_modules" ]; then
    echo -e "${YELLOW}📥 Installing frontend dependencies...${NC}"
    cd new_ui
    npm install
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with required API keys:${NC}"
    echo "  GROQ_API_KEY=your_key_here"
    echo "  OPENROUTER_API_KEY=your_key_here (optional)"
    exit 1
fi

# Create necessary directories
mkdir -p pdf_cache static/animations chroma_db

echo -e "${GREEN}✓ Environment ready${NC}"
echo ""
echo -e "${GREEN}Starting servers...${NC}"
echo -e "  Backend:  ${YELLOW}http://127.0.0.1:8000${NC}"
echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}[Backend]${NC} Starting FastAPI server..."
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${GREEN}[Frontend]${NC} Starting Vite dev server..."
cd new_ui
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
