@echo off
REM Batch script to install git hooks on Windows

echo.
echo ========================================
echo Installing Git Hooks for Memory System
echo ========================================
echo.

REM Check if .git exists
if not exist ".git" (
    echo ERROR: .git directory not found!
    echo Please run this from the repository root.
    pause
    exit /b 1
)

REM Copy post-commit hook
echo [1/2] Installing post-commit hook...
copy /Y ".claude\hooks\post-commit.ps1" ".git\hooks\post-commit" >nul
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy post-commit hook
    pause
    exit /b 1
)
echo       Installed: .git\hooks\post-commit

REM Copy pre-push hook (optional)
echo [2/2] Installing pre-push hook (optional)...
copy /Y ".claude\hooks\pre-push" ".git\hooks\pre-push" >nul
if %errorlevel% neq 0 (
    echo WARNING: Failed to copy pre-push hook (optional)
) else (
    echo       Installed: .git\hooks\pre-push
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo What happens now:
echo   - After each commit, you'll see update reminders
echo   - Use: npm run memory:update to update index
echo.
echo Test it:
echo   1. Make a small change
echo   2. git commit -m "test"
echo   3. See the reminder!
echo.
echo For more info: .claude\AUTOMATION_GUIDE.md
echo.
pause
