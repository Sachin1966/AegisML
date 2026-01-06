@echo off
echo Starting AegisML Backend...

:: Check if we are already in the backend folder or root
if exist "venv" (
    echo Found venv in current directory.
) else (
    if exist "backend\venv" (
        cd backend
    ) else (
        echo Error: Could not find backend/venv environment.
        pause
        exit /b
    )
)

:: Run using the local virtual environment
venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
