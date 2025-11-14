# 🔄 Memory Files Update Guide

## Khi nào cần update?

### CLAUDE.md - Update thường xuyên
**Khi nào:**
- ✅ Thêm coding convention mới
- ✅ Thay đổi workflow/process
- ✅ Thêm common command mới
- ✅ Thay đổi tech stack
- ✅ Thêm best practice mới

**Không cần update:**
- ❌ Fix bug nhỏ
- ❌ Thay đổi implementation details
- ❌ Refactor code bên trong function

**Cách update:**
```bash
# Option 1: Dùng command
/memory

# Option 2: Edit trực tiếp
code CLAUDE.md

# Option 3: Quick add
# Remember: Always validate user input before database operations
```

---

### CODEBASE_INDEX.md - Update khi có structural changes

**Khi nào:**
- ✅ Thêm service mới
- ✅ Thêm controller/service file mới
- ✅ Đổi tên files quan trọng
- ✅ Thay đổi folder structure
- ✅ Thêm major features

**Không cần update:**
- ❌ Thêm function trong file existing
- ❌ Sửa logic bên trong function
- ❌ Fix bugs

**Cách update:**
```bash
# Auto-regenerate (recommended)
node .claude/regenerate-index.js

# Hoặc manual edit
code .claude/CODEBASE_INDEX.md
```

---

### Context Files - Update ít

**PROJECT_CONTEXT.md:**
- Update khi: Major architecture changes
- Update khi: Thay đổi tech stack
- Update khi: Thêm service mới

**API_ENDPOINTS.md:**
- Update khi: Thêm/sửa API endpoints
- Update khi: Thay đổi request/response format

**COMMON_ISSUES.md:**
- Update khi: Phát hiện issue mới (và solution)
- Update khi: Issue cũ không còn relevant

---

## 📊 Update Frequency Recommendations

| File | Update Frequency | Impact |
|------|------------------|--------|
| CLAUDE.md | Daily/Weekly | HIGH - Được load mỗi session |
| CODEBASE_INDEX.md | Weekly/Monthly | MEDIUM - Dùng khi cần tìm files |
| PROJECT_CONTEXT.md | Monthly | LOW - Dùng cho deep analysis |
| API_ENDPOINTS.md | As needed | LOW - Reference only |
| COMMON_ISSUES.md | As needed | LOW - Troubleshooting only |

---

## 🎯 Best Practices

### 1. Commit to Git
```bash
git add .claude/ CLAUDE.md
git commit -m "docs: update Claude memory files"
git push
```

### 2. Review Before Commit
- Đọc lại để đảm bảo accurate
- Remove outdated information
- Keep it concise

### 3. Team Collaboration
- Thống nhất conventions trong CLAUDE.md
- Mọi người cùng update khi có changes
- Review PR có changes vào memory files

### 4. Version Control
```bash
# Xem history
git log -- CLAUDE.md

# Rollback nếu cần
git checkout HEAD~1 -- CLAUDE.md
```

---

## 🔧 Automation Ideas

### Auto-regenerate index on commit
```bash
# .git/hooks/pre-commit
#!/bin/bash
node .claude/regenerate-index.js
git add .claude/CODEBASE_INDEX.md
```

### Remind to update CLAUDE.md
```bash
# .git/hooks/post-commit
#!/bin/bash
echo "💡 Reminder: Update CLAUDE.md if you added new conventions!"
```

---

## 💡 Tips

1. **Keep CLAUDE.md under 500 lines**
   - Quá dài → tốn tokens
   - Quá ngắn → thiếu info
   - Sweet spot: 300-500 lines

2. **CODEBASE_INDEX.md có thể dài**
   - Không auto-load
   - Chỉ load khi cần
   - Chi tiết > concise

3. **Use imports trong CLAUDE.md**
   ```markdown
   ## API Conventions
   @.claude/api-conventions.md
   ```

4. **Add comments**
   ```markdown
   ## Authentication Flow
   <!-- Updated: 2025-01-06 - Added OAuth support -->
   ```

---

## ❓ FAQ

**Q: Có cần regenerate index sau mỗi commit?**
A: Không. Chỉ regenerate khi thêm files mới hoặc structural changes.

**Q: CLAUDE.md có bị quá dài không?**
A: Check file size. Nếu > 50KB, consider splitting sang files riêng và import.

**Q: Có thể automate updates không?**
A: Một phần. Index có thể auto-generate. CLAUDE.md phải manual vì chứa preferences.

**Q: Team member mới cần làm gì?**
A: Đọc CLAUDE.md để hiểu conventions. Đọc PROJECT_CONTEXT.md để hiểu architecture.

---

## 📝 Update Checklist

Sau mỗi sprint/feature lớn, check:

- [ ] CLAUDE.md có conventions mới?
- [ ] Có files mới cần add vào CODEBASE_INDEX.md?
- [ ] API_ENDPOINTS.md có endpoints mới?
- [ ] Có issues mới cho COMMON_ISSUES.md?
- [ ] PROJECT_CONTEXT.md còn accurate?
- [ ] Commit changes vào git
- [ ] Notify team về updates

---

**Liên hệ:** Nếu có questions về memory system, open issue hoặc ask trong team chat!
