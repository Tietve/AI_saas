@echo off
REM Demo: Phân tích codebase lớn với Claude Code CLI (Windows)
REM Project: my-saas-chat (188 TypeScript files)

echo.
echo ========================================
echo 🚀 DEMO: Claude Code CLI
echo    Large Codebase Analysis
echo ========================================
echo.

REM 1. Project Overview
echo [1/6] Getting project overview...
echo.
claude --add-dir ./backend --add-dir ./frontend --tools "Bash,Glob" -p "Count TypeScript files in backend and frontend (exclude node_modules). Show directory structure."
echo.
echo ---
echo.

REM 2. Find authentication code
echo [2/6] Finding authentication code...
echo.
claude --add-dir ./backend --tools "Grep,Glob" -p "Find all files containing 'auth', 'login', 'jwt', or 'password' keywords. List file paths and line numbers."
echo.
echo ---
echo.

REM 3. Security audit
echo [3/6] Security audit on auth system...
echo.
claude --add-dir ./backend --tools "Read,Grep" -p "Analyze authentication implementation in backend. Check: 1) Password hashing algorithm 2) JWT token security 3) SQL injection prevention 4) Input validation 5) Rate limiting. Output findings with severity levels."
echo.
echo ---
echo.

REM 4. Database queries
echo [4/6] Analyzing database queries...
echo.
claude --add-dir ./backend --tools "Grep,Read" -p "Find all database queries (SQL or Prisma). Check for N+1 problems, missing indexes, inefficient queries, and SQL injection risks."
echo.
echo ---
echo.

REM 5. API endpoints
echo [5/6] Mapping all API endpoints...
echo.
claude --add-dir ./backend --tools "Grep,Read" -p "Find all API routes and endpoints. List HTTP method, path, file location, and whether authentication is required."
echo.
echo ---
echo.

REM 6. Architecture analysis
echo [6/6] Analyzing project architecture...
echo.
claude --add-dir ./backend --add-dir ./frontend --tools "Read,Glob" -p "Analyze the overall project architecture. Describe: 1) Backend structure 2) Frontend structure 3) Communication patterns 4) Technology stack 5) Potential improvements."
echo.
echo ========================================
echo ✅ Analysis complete!
echo ========================================
echo.
echo 💡 Tips:
echo   - Add --output-format json ^> report.json to save results
echo   - Use --disallowed-tools "Bash,Edit" for read-only
echo   - Chain with other commands using pipes
echo.
pause
