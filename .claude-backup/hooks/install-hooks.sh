#!/bin/bash

# Shell script to install git hooks on Linux/Mac

echo ""
echo "========================================"
echo "Installing Git Hooks for Memory System"
echo "========================================"
echo ""

# Check if .git exists
if [ ! -d ".git" ]; then
    echo "❌ ERROR: .git directory not found!"
    echo "Please run this from the repository root."
    exit 1
fi

# Copy post-commit hook
echo "[1/2] Installing post-commit hook..."
cp ".claude/hooks/post-commit" ".git/hooks/post-commit"
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to copy post-commit hook"
    exit 1
fi
chmod +x ".git/hooks/post-commit"
echo "      ✅ Installed: .git/hooks/post-commit"

# Copy pre-push hook (optional)
echo "[2/2] Installing pre-push hook (optional)..."
cp ".claude/hooks/pre-push" ".git/hooks/pre-push" 2>/dev/null
if [ $? -eq 0 ]; then
    chmod +x ".git/hooks/pre-push"
    echo "      ✅ Installed: .git/hooks/pre-push"
else
    echo "      ⚠️  WARNING: Failed to copy pre-push hook (optional)"
fi

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "What happens now:"
echo "  - After each commit, you'll see update reminders"
echo "  - Use: npm run memory:update to update index"
echo ""
echo "Test it:"
echo "  1. Make a small change"
echo "  2. git commit -m 'test'"
echo "  3. See the reminder!"
echo ""
echo "For more info: .claude/AUTOMATION_GUIDE.md"
echo ""
