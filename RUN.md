# Run PaperLens

## Terminal 1 - Backend
```bash
.venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Terminal 2 - Frontend
```bash
cd new_ui
npm run dev
```

Backend: http://127.0.0.1:8000
Frontend: http://127.0.0.1:5173
