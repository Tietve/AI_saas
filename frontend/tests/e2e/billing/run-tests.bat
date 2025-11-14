@echo off
REM Billing E2E Tests Runner for Windows
REM Quick commands to run billing tests

echo ======================================
echo   Billing E2E Tests Runner
echo ======================================
echo.

REM Check if we're in the right directory
cd /d "%~dp0\..\..\.."

echo Select test suite to run:
echo.
echo   1) All billing tests
echo   2) Pricing page tests only
echo   3) Subscription page tests only
echo   4) Usage statistics tests only
echo   5) Run in UI mode (interactive)
echo   6) Run with headed browser
echo   7) Run in debug mode
echo   8) Generate HTML report
echo.
echo   0) Exit
echo.

set /p choice="Enter your choice [0-8]: "

if "%choice%"=="1" (
    echo.
    echo Running all billing tests...
    npx playwright test tests/e2e/billing
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Running pricing page tests...
    npx playwright test tests/e2e/billing/pricing-page.spec.ts
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Running subscription page tests...
    npx playwright test tests/e2e/billing/subscription.spec.ts
    goto end
)

if "%choice%"=="4" (
    echo.
    echo Running usage statistics tests...
    npx playwright test tests/e2e/billing/usage-stats.spec.ts
    goto end
)

if "%choice%"=="5" (
    echo.
    echo Opening Playwright UI mode...
    npx playwright test tests/e2e/billing --ui
    goto end
)

if "%choice%"=="6" (
    echo.
    echo Running tests with headed browser...
    npx playwright test tests/e2e/billing --headed
    goto end
)

if "%choice%"=="7" (
    echo.
    echo Running tests in debug mode...
    npx playwright test tests/e2e/billing --debug
    goto end
)

if "%choice%"=="8" (
    echo.
    echo Generating HTML report...
    npx playwright show-report
    goto end
)

if "%choice%"=="0" (
    echo Exiting...
    goto end
)

echo Error: Invalid choice. Please try again.
pause
exit /b 1

:end
echo.
echo Done!
pause
