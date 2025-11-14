@echo off
REM ================================================================
REM Start All Backend Services (Without Docker)
REM ================================================================

echo.
echo ========================================
echo Starting Backend Services
echo ========================================
echo.

REM Check if services are already running
echo Checking for running services...
netstat -ano | findstr ":4000" > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 4000 already in use!
    set /p kill="Kill existing process? (y/n): "
    if /i "%kill%"=="y" (

        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000"') do (
            echo Killing process %%a
            taskkill /F /PID %%a 2>nul
        )
    )
)

netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 already in use!
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        echo Killing process %%a
        taskkill /F /PID %%a 2>nul
    )
)

netstat -ano | findstr ":3002" > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3002 already in use!
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002"') do (
        echo Killing process %%a
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo Starting services...
echo.

REM Start API Gateway
echo [1/3] Starting API Gateway on port 4000...
start "API Gateway" cmd /k "cd api-gateway && npm run dev"
timeout /t 3 /nobreak > nul

REM Start Auth Service
echo [2/3] Starting Auth Service on port 3001...
start "Auth Service" cmd /k "cd services\auth-service && npm run dev"
timeout /t 3 /nobreak > nul

REM Start Chat Service
echo [3/3] Starting Chat Service on port 3002...
start "Chat Service" cmd /k "cd services\chat-service && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo API Gateway:  http://localhost:4000
echo Auth Service: http://localhost:3001
echo Chat Service: http://localhost:3002
echo.
echo Press any key to check health status...
pause > nul

REM Wait for services to fully start
echo.
echo Waiting for services to initialize...
timeout /t 10 /nobreak > nul

REM Check health
echo.
echo Checking service health...
echo.

curl -s http://localhost:4000/health
echo.
curl -s http://localhost:3001/health
echo.
curl -s http://localhost:3002/health
echo.

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo To stop all services, close the terminal windows or press Ctrl+C in each.
echo.
pause
