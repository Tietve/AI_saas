# 🧪 Frontend Testing Guide - Đơn Giản!

## 🎯 CHẠY THỬ NGAY (5 phút)

### Bước 1: Cài đặt (chỉ làm 1 lần)

```bash
cd frontend/

# Cài Playwright
npm install -D @playwright/test playwright

# Download browsers
npx playwright install
```

Đợi khoảng 1-2 phút để download Chrome, Firefox, Safari.

---

### Bước 2: Start frontend

```bash
# Terminal 1: Start frontend
npm run dev
```

Đợi thấy: `Local: http://localhost:3000`

---

### Bước 3: Chạy test đơn giản

```bash
# Terminal 2: Run test
npx playwright test tests/e2e/example.spec.ts --headed
```

**`--headed`** nghĩa là: Hiện browser để bạn xem test chạy!

**Kết quả sẽ thấy:**
```
Running 3 tests using 1 worker

✓ homepage should load (2s)
✓ should navigate to different routes (1s)
✓ page should be responsive (3s)

3 passed (6s)
```

---

## 📊 CÁC LỆNH QUAN TRỌNG

### Xem test chạy (có UI)
```bash
npm run test:e2e:headed
```

### Debug test (dừng từng bước)
```bash
npm run test:e2e:debug
```

### Chạy test backend integration
```bash
# Make sure backend is running first!
cd ../backend
npm run docker:up

# Then test
cd ../frontend
npx playwright test tests/integration/backend-health.spec.ts
```

### Xem report đẹp
```bash
npx playwright test
npx playwright show-report
```

Sẽ mở browser với report rất đẹp!

---

## 🎨 TEST GÌ?

### `tests/e2e/example.spec.ts` - Test cơ bản
- Homepage có load không?
- Navigation có hoạt động không?
- Responsive design OK không?

### `tests/integration/backend-health.spec.ts` - Test backend
- API Gateway có chạy không?
- Các microservices có healthy không?
- CORS có configured không?

---

## 🚀 CHẠY 5 AGENTS SONG SONG (Nâng cao)

Sau khi đã quen với test cơ bản, bạn có thể chạy 5 agents:

```bash
cd ../backend/
npm run test:frontend:parallel
```

Hoặc paste command này vào Claude:

```
Launch 5 frontend testing agents in PARALLEL:

Agent 1: E2E tests - cd frontend && npx playwright test tests/e2e
Agent 2: Visual tests - cd frontend && npx playwright test tests/visual
Agent 3: Integration tests - cd frontend && npx playwright test tests/integration
Agent 4: Layout check - node .claude/test-templates/layout-checker.js http://localhost:3000
Agent 5: Performance - cd frontend && npm run test:performance

Work in parallel, report when done!
```

---

## 🐛 TROUBLESHOOTING

### "Error: browserType.launch: Executable doesn't exist"
```bash
npx playwright install
```

### "ECONNREFUSED localhost:3000"
Frontend chưa chạy! Start trước:
```bash
npm run dev
```

### "ECONNREFUSED localhost:4000"
Backend chưa chạy! Start trước:
```bash
cd backend/
npm run docker:up
```

### Test chạy quá nhanh, không thấy gì
```bash
# Thêm --headed để xem browser
npm run test:e2e:headed

# Hoặc --debug để chạy từng bước
npm run test:e2e:debug
```

---

## 📚 HỌC THÊM

- **Playwright Docs:** https://playwright.dev
- **Example tests:** Xem các file trong `tests/`
- **Full guide:** `../.claude/FRONTEND_TESTING_AGENTS.md`

---

## 💡 MẸO HAY

### 1. Chạy 1 test cụ thể
```bash
npx playwright test tests/e2e/example.spec.ts
```

### 2. Chạy với trình duyệt cụ thể
```bash
npx playwright test --project=chromium    # Chrome
npx playwright test --project=firefox     # Firefox
npx playwright test --project=webkit      # Safari
```

### 3. Chạy ở chế độ UI (rất trực quan!)
```bash
npx playwright test --ui
```

### 4. Record test (Playwright tự viết test cho bạn!)
```bash
npx playwright codegen http://localhost:3000
```

Playwright sẽ mở browser, bạn click around, nó tự viết code test! 🤯

---

## 🎯 BẮT ĐẦU NGAY!

```bash
# 1. Cài đặt
npm install -D @playwright/test playwright
npx playwright install

# 2. Start app
npm run dev

# 3. Chạy test (terminal khác)
npx playwright test tests/e2e/example.spec.ts --headed

# Xem test chạy trên browser! 🎉
```

---

**Có gì không hiểu? Hỏi tôi nhé!** 😊
