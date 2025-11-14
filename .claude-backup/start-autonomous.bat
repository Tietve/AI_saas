@echo off
REM Start Claude in Autonomous Mode with safe settings

echo.
echo ========================================
echo Starting Claude in AUTONOMOUS MODE
echo ========================================
echo.
echo Features:
echo   - Auto-accepts file edits/writes
echo   - Auto-runs safe bash commands
echo   - Blocks dangerous operations
echo   - Maximum productivity!
echo.
echo ⚠️  SAFETY:
echo   - Create backup branch first!
echo   - Review changes after session
echo   - Use Ctrl+C to stop anytime
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul
echo.

REM Start Claude with autonomous settings
claude --permission-mode acceptEdits --settings .claude\settings-autonomous.json

echo.
echo ========================================
echo Session Ended
echo ========================================
echo.
echo 📊 Review changes with:
echo    git status
echo    git diff
echo.
echo ✅ If good: git add . && git commit -m "..."
echo ❌ If bad:  git reset --hard HEAD
echo.
pause
