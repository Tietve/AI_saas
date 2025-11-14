@echo off
REM Integration Tests Runner Script (Windows)
REM Usage: run-tests.bat [option]
REM Options: all, auth, chat, billing, health

setlocal enabledelayedexpansion

echo ================================
echo Integration Tests Runner
echo ================================
echo.

REM Check if services are running
echo Checking services...

curl -s -f -o NUL http://localhost:4000/health
if %errorlevel% equ 0 (
    echo   [OK] API Gateway is running
) else (
    echo   [X] API Gateway is not running
    set "services_down=true"
)

curl -s -f -o NUL http://localhost:3001/health
if %errorlevel% equ 0 (
    echo   [OK] Auth Service is running
) else (
    echo   [X] Auth Service is not running
    set "services_down=true"
)

curl -s -f -o NUL http://localhost:3003/health
if %errorlevel% equ 0 (
    echo   [OK] Chat Service is running
) else (
    echo   [X] Chat Service is not running
    set "services_down=true"
)

curl -s -f -o NUL http://localhost:3004/health
if %errorlevel% equ 0 (
    echo   [OK] Billing Service is running
) else (
    echo   [X] Billing Service is not running
    set "services_down=true"
)

echo.

if defined services_down (
    echo WARNING: Some services are not running!
    echo TIP: Start services with: npm run docker:up ^&^& npm run dev:all
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "!continue!"=="y" exit /b 1
)

REM Get test option
set "option=%1"
if "%option%"=="" set "option=all"

echo Running tests...
echo.

if "%option%"=="all" (
    echo Running all integration tests
    npx playwright test tests/integration/
) else if "%option%"=="auth" (
    echo Running Auth API tests
    npx playwright test tests/integration/auth-api.spec.ts
) else if "%option%"=="chat" (
    echo Running Chat API tests
    npx playwright test tests/integration/chat-api.spec.ts
) else if "%option%"=="billing" (
    echo Running Billing API tests
    npx playwright test tests/integration/billing-api.spec.ts
) else if "%option%"=="health" (
    echo Running Health Check tests
    npx playwright test tests/integration/services-health.spec.ts
) else if "%option%"=="ui" (
    echo Running tests with UI
    npx playwright test tests/integration/ --ui
) else if "%option%"=="headed" (
    echo Running tests in headed mode
    npx playwright test tests/integration/ --headed
) else (
    echo Unknown option: %option%
    echo Usage: run-tests.bat [all^|auth^|chat^|billing^|health^|ui^|headed]
    exit /b 1
)

echo.
echo Tests completed!
echo.
echo View report: npx playwright show-report

endlocal
