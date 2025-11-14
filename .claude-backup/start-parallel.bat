@echo off
REM Start Claude with Parallel Agents Support

echo.
echo ============================================
echo   PARALLEL AGENTS MODE
echo ============================================
echo.
echo Features:
echo   - Multiple Claude agents working together
echo   - 3-4x faster for parallel tasks
echo   - Smart conflict prevention
echo   - Autonomous execution
echo.
echo Available Agents:
echo   - service-fixer    : Fix errors in services
echo   - test-writer      : Write comprehensive tests
echo   - code-reviewer    : Review code quality
echo   - doc-writer       : Write documentation
echo   - performance-opt  : Optimize performance
echo   - security-auditor : Security audit
echo   - refactorer       : Refactor code
echo   - api-documenter   : Document APIs
echo   - db-migrator      : Database migrations
echo   - error-hunter     : Find all errors
echo.
echo Example Usage:
echo   "Launch 3 service-fixer agents in parallel:
echo    - Agent 1: Fix auth-service
echo    - Agent 2: Fix chat-service
echo    - Agent 3: Fix billing-service"
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul
echo.

REM Start Claude with agents and autonomous mode
claude --agents .claude\agents.json ^
       --permission-mode acceptEdits ^
       --settings .claude\settings-autonomous.json

echo.
echo ============================================
echo Session Ended
echo ============================================
echo.
echo Review changes:
echo    git status
echo    git diff
echo.
pause
