#!/bin/bash
# Demo: Phân tích codebase lớn với Claude Code CLI
# Project: my-saas-chat (188 TypeScript files)

echo "🚀 DEMO: Claude Code CLI - Large Codebase Analysis"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Project Overview
echo -e "${GREEN}[1/6] Getting project overview...${NC}"
claude --add-dir ./backend --add-dir ./frontend \
  --tools "Bash,Glob" \
  -p "Count TypeScript files in backend and frontend (exclude node_modules)"

echo ""
echo "---"
echo ""

# 2. Find all authentication-related code
echo -e "${GREEN}[2/6] Finding authentication code...${NC}"
claude --add-dir ./backend \
  --tools "Grep,Glob" \
  -p "Find all files containing 'auth', 'login', 'jwt', 'password' keywords"

echo ""
echo "---"
echo ""

# 3. Security audit (focused)
echo -e "${GREEN}[3/6] Security audit on auth system...${NC}"
claude --add-dir ./backend/auth-service \
       --add-dir ./backend/api-gateway \
  --tools "Read,Grep" \
  -p "Analyze authentication implementation. Check:
      1. Password hashing algorithm (should be bcrypt/argon2)
      2. JWT token generation and validation
      3. SQL injection prevention
      4. Input validation
      5. Rate limiting on auth endpoints

      Output: JSON format with findings and severity"

echo ""
echo "---"
echo ""

# 4. Database query analysis
echo -e "${GREEN}[4/6] Analyzing database queries...${NC}"
claude --add-dir ./backend \
  --tools "Grep,Read" \
  -p "Find all SQL/Prisma queries. Check for:
      - N+1 query problems
      - Missing indexes
      - Inefficient queries
      - SQL injection risks"

echo ""
echo "---"
echo ""

# 5. API endpoint mapping
echo -e "${GREEN}[5/6] Mapping all API endpoints...${NC}"
claude --add-dir ./backend \
  --tools "Grep,Read" \
  -p "Find all API routes/endpoints. List them with:
      - HTTP method
      - Path
      - File location
      - Authentication required (yes/no)"

echo ""
echo "---"
echo ""

# 6. Cross-service consistency check
echo -e "${GREEN}[6/6] Checking consistency across services...${NC}"
claude --add-dir ./backend/auth-service \
       --add-dir ./backend/user-service \
       --add-dir ./backend/chat-service \
  -p "Compare error handling, logging patterns, and validation logic across services.
      Find inconsistencies and suggest standardization."

echo ""
echo "=================================================="
echo -e "${YELLOW}✅ Analysis complete!${NC}"
echo ""
echo "💡 Tips:"
echo "  - Add --output-format json to save results"
echo "  - Use --disallowed-tools 'Bash,Edit' for read-only analysis"
echo "  - Pipe output: | tee report.txt"
echo ""
