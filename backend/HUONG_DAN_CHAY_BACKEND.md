# 🚀 Hướng Dẫn Chạy Backend

## 📋 Mục lục
1. [Option 1: Chạy với Docker (Production-like)](#option-1-với-docker)
2. [Option 2: Chạy trực tiếp (Development - KHÔNG CẦN Docker)](#option-2-không-cần-docker) ⭐ Khuyến nghị cho dev
3. [So sánh 2 Options](#so-sánh)
4. [Troubleshooting](#troubleshooting)

---

## Option 1: Với Docker (Production-like)

### ✅ Ưu điểm:
- Môi trường giống production
- Có đầy đủ: Postgres, Redis, Jaeger, RabbitMQ
- Dễ dàng quản lý với `docker-compose`

### 📝 Cách chạy:

1. **Khởi động Docker Desktop**
   - Mở Docker Desktop từ Start Menu
   - Đợi Docker khởi động xong (icon không còn animation)

2. **Start Infrastructure**
   ```bash
   cd backend
   npm run docker:up
   ```

3. **Start Backend Services**
   ```bash
   # Terminal 1
   npm run dev:gateway

   # Terminal 2
   npm run dev:auth

   # Terminal 3
   npm run dev:chat
   ```

4. **Dừng Infrastructure**
   ```bash
   npm run docker:down
   ```

---

## Option 2: KHÔNG CẦN Docker ⭐

### ✅ Ưu điểm:
- **NHANH** - Không cần chờ Docker
- **ÍT TỐN TÀI NGUYÊN** - Chỉ chạy Node.js
- **ĐƠN GIẢN** - Click chạy là xong
- Sử dụng Cloud Services:
  - ✅ **Neon Postgres** (đã config sẵn trong .env)
  - ✅ **Upstash Redis** (đã config sẵn trong .env)

### 📝 Cách chạy:

#### **Cách 1: Dùng Script (KHUYẾN NGHỊ)**

**Lần đầu tiên & các lần sau:**

**Nếu dùng Command Prompt (CMD):**
```bash
# Vào thư mục backend
cd D:\my-saas-chat\backend

# Chạy script
start-dev.bat
```

**Nếu dùng PowerShell:**
```powershell
# Vào thư mục backend
cd D:\my-saas-chat\backend

# Chạy script (cần .\ ở đầu)
.\start-dev.bat
```

**Hoặc đơn giản: Double click file `start-dev.bat`**

Script sẽ tự động:
- ✅ Kill các process cũ (nếu có)
- ✅ Mở 3 terminal windows cho 3 services
- ✅ Check health của tất cả services
- ✅ Hiển thị kết quả

#### **Cách 2: Manual (Nếu muốn kiểm soát từng service)**

Mở 3 terminal riêng biệt:

```bash
# Terminal 1 - API Gateway
cd backend
npm run dev:gateway

# Terminal 2 - Auth Service
cd backend
npm run dev:auth

# Terminal 3 - Chat Service
cd backend
npm run dev:chat
```

### 📊 Services sẽ chạy ở:
```
✅ API Gateway:  http://localhost:4000
✅ Auth Service: http://localhost:3001
✅ Chat Service: http://localhost:3002
```

### 🔧 Kiểm tra Health:
```bash
curl http://localhost:4000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## So sánh 2 Options

| Tính năng | Option 1 (Docker) | Option 2 (No Docker) |
|-----------|------------------|---------------------|
| **Tốc độ khởi động** | 🐢 Chậm (1-2 phút) | ⚡ Nhanh (10 giây) |
| **RAM sử dụng** | 🔴 ~4GB | 🟢 ~500MB |
| **CPU sử dụng** | 🔴 Cao | 🟢 Thấp |
| **Setup lần đầu** | 🔴 Phức tạp | 🟢 Đơn giản |
| **Giống Production** | ✅ Giống | ⚠️ Khác một chút |
| **Local Database** | ✅ Có | ❌ Dùng Cloud |
| **Tracing (Jaeger)** | ✅ Có | ❌ Không |
| **Message Queue** | ✅ Có | ❌ Không (optional) |

### 💡 Khuyến nghị:

- **Development hàng ngày**: Dùng **Option 2** (không Docker)
- **Testing Production issues**: Dùng **Option 1** (với Docker)
- **Demo cho khách hàng**: Dùng **Option 2** (nhanh hơn)

---

## Troubleshooting

### ❌ Port đã được sử dụng

**Triệu chứng:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Giải pháp:**

```bash
# Tìm process đang dùng port
netstat -ano | findstr :4000

# Kill process (thay PID bằng số tìm được)
taskkill /F /PID <PID>
```

Hoặc chạy lại `start-dev.bat` - script sẽ tự động kill.

### ❌ Redis connection error (ECONNREFUSED)

**Triệu chứng:**
```
Error: connect ECONNREFUSED ::1:6379
```

**Giải pháp:**

Không sao! Backend sử dụng **Upstash Redis** (cloud) - lỗi này chỉ là warning không ảnh hưởng.

Nếu muốn tắt warning:
1. Mở file `.env`
2. Đảm bảo có:
   ```env
   UPSTASH_REDIS_REST_URL=https://teaching-worm-6964.upstash.io
   UPSTASH_REDIS_REST_TOKEN=ARs0AAImcDIyNWQyNDY0NjU4NmI0MGZhOWM2YjRkNGFhOWVmMDRlN3AyNjk2NA
   ```

### ❌ Database connection error

**Triệu chứng:**
```
Error: Can't reach database server
```

**Giải pháp:**

Check file `.env` có dòng này:
```env
DATABASE_URL=postgresql://neondb_owner:npg_vQGfJx9H8pjD@ep-sparkling-sun-a1gledz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Nếu Neon Postgres bị lỗi, có thể start local Postgres với Docker:
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine
```

---

## 📝 Lưu ý quan trọng

### Với Option 2 (No Docker):

1. **Database**: Dùng Neon Postgres (cloud) - đã config sẵn
2. **Redis**: Dùng Upstash Redis (cloud) - đã config sẵn
3. **File Upload**: Có thể lưu local hoặc dùng Cloudflare R2
4. **Jaeger Tracing**: Không có - nhưng không ảnh hưởng dev
5. **RabbitMQ**: Không có - đã disable trong dev mode

### Khi nào CẦN Docker?

- Test distributed tracing với Jaeger
- Test message queue với RabbitMQ
- Test với database giống production
- Chạy full microservices architecture

---

## 🎯 Quick Start (TL;DR)

**Muốn chạy nhanh nhất?**

**Command Prompt:**
```bash
cd D:\my-saas-chat\backend
start-dev.bat
```

**PowerShell:**
```powershell
cd D:\my-saas-chat\backend
.\start-dev.bat
```

**Hoặc: Double click file `start-dev.bat`**

**Xong!** 🚀

---

## 📞 Support

Nếu gặp vấn đề, check:
1. File `.env` có đầy đủ config không
2. Port 3001, 3002, 4000 có bị chiếm không
3. Node.js version >= 18
4. npm đã install dependencies chưa (`npm install`)

---

**Happy coding!** 🎉
