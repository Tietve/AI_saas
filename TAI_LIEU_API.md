# Tài Liệu API Đầy Đủ

**Tài Liệu Tham Khảo API Backend Microservices**
**Phiên bản**: 1.0.0
**Cập nhật lần cuối**: 29 tháng 10, 2025
**URL Cơ bản**: `http://localhost:4000/api`

---

## Mục Lục

1. [Xác Thực](#xác-thực)
2. [API Dịch Vụ Xác Thực](#api-dịch-vụ-xác-thực)
3. [API Dịch Vụ Chat](#api-dịch-vụ-chat)
4. [API Dịch Vụ Thanh Toán](#api-dịch-vụ-thanh-toán)
5. [API Dịch Vụ Phân Tích](#api-dịch-vụ-phân-tích)
6. [Mã Lỗi](#mã-lỗi)

---

## Xác Thực

Hầu hết các endpoint yêu cầu xác thực qua session cookies. Sau khi đăng nhập thành công, session cookie sẽ tự động được đính kèm trong các yêu cầu tiếp theo.

**Header Xác Thực**: Dựa trên Session (tự động xử lý cookie)

**Endpoint Công Khai** (không cần xác thực):
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/verify-email` - Xác thực email
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/billing/plans` - Xem các gói dịch vụ

**Endpoint Được Bảo Vệ**: Tất cả endpoint khác yêu cầu session hợp lệ

---

## API Dịch Vụ Xác Thực

**Đường dẫn cơ bản**: `/api/auth`
**Cổng dịch vụ**: 3001
**Route qua Gateway**: `http://localhost:4000/api/auth/*`

### 1. Đăng Ký

Tạo tài khoản người dùng mới.

**Endpoint**: `POST /api/auth/signup`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 5 yêu cầu mỗi 15 phút

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "Nguyễn Văn A"
}
```

**Response Thành Công** (201 Created):
```json
{
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  "userId": "user_abc123"
}
```

**Response Lỗi**:
- `400`: Định dạng email hoặc mật khẩu không hợp lệ
- `409`: Email đã được đăng ký
- `429`: Quá nhiều lần đăng ký

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Nguyễn Văn A"
  }'
```

---

### 2. Đăng Nhập

Xác thực và tạo session.

**Endpoint**: `POST /api/auth/signin`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 10 yêu cầu mỗi 15 phút

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "isVerified": true,
    "role": "user",
    "createdAt": "2025-10-28T10:00:00.000Z"
  }
}
```

**Response Lỗi**:
- `400`: Thiếu email hoặc mật khẩu
- `401`: Thông tin đăng nhập không hợp lệ
- `403`: Email chưa được xác thực
- `429`: Quá nhiều lần đăng nhập

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### 3. Đăng Xuất

Kết thúc session hiện tại.

**Endpoint**: `POST /api/auth/signout`
**Xác thực**: Yêu cầu

**Response Thành Công** (200 OK):
```json
{
  "message": "Đăng xuất thành công"
}
```

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/signout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 4. Lấy Thông Tin Người Dùng Hiện Tại

Lấy thông tin của người dùng đã xác thực.

**Endpoint**: `GET /api/auth/me`
**Xác thực**: Yêu cầu

**Response Thành Công** (200 OK):
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "isVerified": true,
    "role": "user",
    "createdAt": "2025-10-28T10:00:00.000Z"
  }
}
```

**Response Lỗi**:
- `401`: Chưa xác thực

**Ví dụ cURL**:
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -b cookies.txt
```

---

### 5. Xác Thực Email

Xác thực địa chỉ email bằng token được gửi qua email.

**Endpoint**: `POST /api/auth/verify-email`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 20 yêu cầu mỗi giờ

**Request Body**:
```json
{
  "token": "verification_token_here"
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Email đã được xác thực thành công"
}
```

**Response Lỗi**:
- `400`: Token không hợp lệ hoặc đã hết hạn
- `404`: Không tìm thấy người dùng

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz456"
  }'
```

---

### 6. Quên Mật Khẩu

Yêu cầu email đặt lại mật khẩu.

**Endpoint**: `POST /api/auth/forgot-password`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 3 yêu cầu mỗi giờ

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Email đặt lại mật khẩu đã được gửi"
}
```

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

### 7. Đặt Lại Mật Khẩu

Đặt lại mật khẩu bằng token từ email.

**Endpoint**: `POST /api/auth/reset-password`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 3 yêu cầu mỗi giờ

**Request Body**:
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePassword123!"
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

**Response Lỗi**:
- `400`: Token không hợp lệ/hết hạn hoặc mật khẩu yếu
- `404`: Không tìm thấy người dùng

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz456",
    "newPassword": "NewSecurePassword123!"
  }'
```

---

### 8. Gửi Lại Email Xác Thực

Gửi lại link xác thực email.

**Endpoint**: `POST /api/auth/resend-verification`
**Xác thực**: Không yêu cầu
**Giới hạn tốc độ**: 3 yêu cầu mỗi giờ

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Email xác thực đã được gửi"
}
```

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## API Dịch Vụ Chat

**Đường dẫn cơ bản**: `/api/chat`
**Cổng dịch vụ**: 3002
**Route qua Gateway**: `http://localhost:4000/api/chat/*`

### 1. Gửi Tin Nhắn

Gửi tin nhắn đến AI provider và nhận phản hồi.

**Endpoint**: `POST /api/chat/chat`
**Xác thực**: Yêu cầu

**Request Body**:
```json
{
  "message": "Thủ đô của Pháp là gì?",
  "provider": "openai",
  "model": "gpt-4",
  "conversationId": "conv_123" // Tùy chọn, tạo cuộc hội thoại mới nếu không cung cấp
}
```

**Response Thành Công** (200 OK):
```json
{
  "response": "Thủ đô của Pháp là Paris.",
  "conversationId": "conv_123",
  "messageId": "msg_456",
  "tokensUsed": 25,
  "provider": "openai",
  "model": "gpt-4",
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

**Response Lỗi**:
- `400`: Provider hoặc model không hợp lệ
- `401`: Chưa xác thực
- `402`: Không đủ credits
- `429`: Vượt quá giới hạn tốc độ

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/chat/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "message": "Thủ đô của Pháp là gì?",
    "provider": "openai",
    "model": "gpt-4"
  }'
```

---

### 2. Lấy Danh Sách Cuộc Hội Thoại

Lấy tất cả cuộc hội thoại của người dùng đã xác thực.

**Endpoint**: `GET /api/chat/conversations`
**Xác thực**: Yêu cầu

**Tham số Query**:
- `limit` (tùy chọn): Số lượng cuộc hội thoại trả về (mặc định: 50)
- `offset` (tùy chọn): Offset phân trang (mặc định: 0)

**Response Thành Công** (200 OK):
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": "Thảo luận về Paris",
      "lastMessageAt": "2025-10-29T10:00:00.000Z",
      "messageCount": 5,
      "provider": "openai",
      "model": "gpt-4",
      "createdAt": "2025-10-29T09:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/chat/conversations?limit=10&offset=0" \
  -b cookies.txt
```

---

### 3. Lấy Cuộc Hội Thoại Theo ID

Lấy một cuộc hội thoại cụ thể với tất cả tin nhắn.

**Endpoint**: `GET /api/chat/conversations/:id`
**Xác thực**: Yêu cầu

**Tham số Đường dẫn**:
- `id`: ID cuộc hội thoại

**Response Thành Công** (200 OK):
```json
{
  "conversation": {
    "id": "conv_123",
    "title": "Thảo luận về Paris",
    "provider": "openai",
    "model": "gpt-4",
    "createdAt": "2025-10-29T09:00:00.000Z",
    "messages": [
      {
        "id": "msg_456",
        "role": "user",
        "content": "Thủ đô của Pháp là gì?",
        "timestamp": "2025-10-29T10:00:00.000Z"
      },
      {
        "id": "msg_457",
        "role": "assistant",
        "content": "Thủ đô của Pháp là Paris.",
        "tokensUsed": 25,
        "timestamp": "2025-10-29T10:00:01.000Z"
      }
    ]
  }
}
```

**Response Lỗi**:
- `404`: Không tìm thấy cuộc hội thoại
- `403`: Không có quyền truy cập cuộc hội thoại

**Ví dụ cURL**:
```bash
curl -X GET http://localhost:4000/api/chat/conversations/conv_123 \
  -b cookies.txt
```

---

### 4. Xóa Cuộc Hội Thoại

Xóa cuộc hội thoại và tất cả tin nhắn.

**Endpoint**: `DELETE /api/chat/conversations/:id`
**Xác thực**: Yêu cầu

**Tham số Đường dẫn**:
- `id`: ID cuộc hội thoại

**Response Thành Công** (200 OK):
```json
{
  "message": "Xóa cuộc hội thoại thành công"
}
```

**Response Lỗi**:
- `404`: Không tìm thấy cuộc hội thoại
- `403`: Không có quyền truy cập cuộc hội thoại

**Ví dụ cURL**:
```bash
curl -X DELETE http://localhost:4000/api/chat/conversations/conv_123 \
  -b cookies.txt
```

---

### 5. Lấy Thống Kê Sử Dụng

Lấy thống kê sử dụng chat của người dùng đã xác thực.

**Endpoint**: `GET /api/chat/usage`
**Xác thực**: Yêu cầu

**Tham số Query**:
- `startDate` (tùy chọn): Ngày bắt đầu thống kê (ISO 8601)
- `endDate` (tùy chọn): Ngày kết thúc thống kê (ISO 8601)

**Response Thành Công** (200 OK):
```json
{
  "totalMessages": 150,
  "totalTokens": 45000,
  "conversationCount": 12,
  "byProvider": {
    "openai": {
      "messages": 100,
      "tokens": 30000
    },
    "anthropic": {
      "messages": 50,
      "tokens": 15000
    }
  },
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-29T23:59:59.000Z"
  }
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/chat/usage?startDate=2025-10-01&endDate=2025-10-29" \
  -b cookies.txt
```

---

## API Dịch Vụ Thanh Toán

**Đường dẫn cơ bản**: `/api/billing`
**Cổng dịch vụ**: 3003
**Route qua Gateway**: `http://localhost:4000/api/billing/*`

### 1. Tạo Đăng Ký

Đăng ký gói dịch vụ.

**Endpoint**: `POST /api/billing/subscribe`
**Xác thực**: Yêu cầu

**Request Body**:
```json
{
  "planId": "pro",
  "paymentMethodId": "pm_1234567890"
}
```

**Response Thành Công** (201 Created):
```json
{
  "message": "Tạo đăng ký thành công",
  "subscription": {
    "id": "sub_abc123",
    "planId": "pro",
    "status": "active",
    "currentPeriodStart": "2025-10-29T00:00:00.000Z",
    "currentPeriodEnd": "2025-11-29T00:00:00.000Z",
    "tokensIncluded": 100000,
    "tokensUsed": 0,
    "amount": 29.99,
    "currency": "USD"
  }
}
```

**Response Lỗi**:
- `400`: Gói hoặc phương thức thanh toán không hợp lệ
- `409`: Đã đăng ký một gói dịch vụ

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "planId": "pro",
    "paymentMethodId": "pm_1234567890"
  }'
```

---

### 2. Hủy Đăng Ký

Hủy đăng ký hiện tại.

**Endpoint**: `POST /api/billing/cancel`
**Xác thực**: Yêu cầu

**Request Body**:
```json
{
  "cancelAtPeriodEnd": true // Tùy chọn, mặc định: true
}
```

**Response Thành Công** (200 OK):
```json
{
  "message": "Đăng ký sẽ bị hủy vào cuối chu kỳ",
  "subscription": {
    "id": "sub_abc123",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2025-11-29T00:00:00.000Z"
  }
}
```

**Response Lỗi**:
- `404`: Không tìm thấy đăng ký đang hoạt động

**Ví dụ cURL**:
```bash
curl -X POST http://localhost:4000/api/billing/cancel \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "cancelAtPeriodEnd": true
  }'
```

---

### 3. Lấy Thông Tin Đăng Ký

Lấy chi tiết đăng ký hiện tại.

**Endpoint**: `GET /api/billing/subscription`
**Xác thực**: Yêu cầu

**Response Thành Công** (200 OK):
```json
{
  "subscription": {
    "id": "sub_abc123",
    "planId": "pro",
    "planName": "Gói Pro",
    "status": "active",
    "currentPeriodStart": "2025-10-29T00:00:00.000Z",
    "currentPeriodEnd": "2025-11-29T00:00:00.000Z",
    "tokensIncluded": 100000,
    "tokensUsed": 25000,
    "tokensRemaining": 75000,
    "amount": 29.99,
    "currency": "USD",
    "cancelAtPeriodEnd": false
  }
}
```

**Response Lỗi**:
- `404`: Không tìm thấy đăng ký (trả về thông tin gói miễn phí)

**Ví dụ cURL**:
```bash
curl -X GET http://localhost:4000/api/billing/subscription \
  -b cookies.txt
```

---

### 4. Lấy Thông Tin Sử Dụng

Lấy thông tin sử dụng thanh toán.

**Endpoint**: `GET /api/billing/usage`
**Xác thực**: Yêu cầu

**Tham số Query**:
- `startDate` (tùy chọn): Ngày bắt đầu (ISO 8601)
- `endDate` (tùy chọn): Ngày kết thúc (ISO 8601)

**Response Thành Công** (200 OK):
```json
{
  "currentPeriod": {
    "start": "2025-10-29T00:00:00.000Z",
    "end": "2025-11-29T00:00:00.000Z"
  },
  "tokensIncluded": 100000,
  "tokensUsed": 25000,
  "tokensRemaining": 75000,
  "usagePercentage": 25,
  "overageTokens": 0,
  "overageCost": 0,
  "dailyUsage": [
    {
      "date": "2025-10-29",
      "tokens": 1500
    }
  ]
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/billing/usage?startDate=2025-10-01" \
  -b cookies.txt
```

---

### 5. Lấy Lịch Sử Thanh Toán

Lấy lịch sử thanh toán.

**Endpoint**: `GET /api/billing/payments`
**Xác thực**: Yêu cầu

**Tham số Query**:
- `limit` (tùy chọn): Số lượng thanh toán (mặc định: 50)
- `offset` (tùy chọn): Offset phân trang (mặc định: 0)

**Response Thành Công** (200 OK):
```json
{
  "payments": [
    {
      "id": "pay_123",
      "amount": 29.99,
      "currency": "USD",
      "status": "succeeded",
      "description": "Gói Pro - Hàng tháng",
      "createdAt": "2025-10-29T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/billing/payments?limit=10" \
  -b cookies.txt
```

---

### 6. Lấy Các Gói Dịch Vụ

Lấy tất cả gói đăng ký có sẵn (endpoint công khai).

**Endpoint**: `GET /api/billing/plans`
**Xác thực**: Không yêu cầu

**Response Thành Công** (200 OK):
```json
{
  "plans": [
    {
      "id": "free",
      "name": "Gói Miễn Phí",
      "price": 0,
      "currency": "USD",
      "interval": "month",
      "tokensIncluded": 10000,
      "features": [
        "10,000 tokens/tháng",
        "Hỗ trợ cơ bản",
        "Truy cập GPT-3.5"
      ]
    },
    {
      "id": "pro",
      "name": "Gói Pro",
      "price": 29.99,
      "currency": "USD",
      "interval": "month",
      "tokensIncluded": 100000,
      "features": [
        "100,000 tokens/tháng",
        "Hỗ trợ ưu tiên",
        "Tất cả mô hình AI",
        "Phân tích nâng cao"
      ]
    },
    {
      "id": "enterprise",
      "name": "Gói Doanh Nghiệp",
      "price": 99.99,
      "currency": "USD",
      "interval": "month",
      "tokensIncluded": 500000,
      "features": [
        "500,000 tokens/tháng",
        "Hỗ trợ 24/7 chuyên dụng",
        "Tích hợp tùy chỉnh",
        "Đảm bảo SLA"
      ]
    }
  ]
}
```

**Ví dụ cURL**:
```bash
curl -X GET http://localhost:4000/api/billing/plans
```

---

## API Dịch Vụ Phân Tích

**Đường dẫn cơ bản**: `/api/analytics`
**Cổng dịch vụ**: 3004
**Route qua Gateway**: `http://localhost:4000/api/analytics/*`

Tất cả endpoint phân tích yêu cầu xác thực và vai trò admin trừ khi được chỉ định khác.

### Phân Tích Người Dùng

#### 1. Lấy Số Lượng Người Dùng

Lấy tổng số người dùng.

**Endpoint**: `GET /api/analytics/users/count`
**Xác thực**: Yêu cầu (Admin)

**Response Thành Công** (200 OK):
```json
{
  "totalUsers": 1234,
  "verified": 1100,
  "unverified": 134
}
```

**Ví dụ cURL**:
```bash
curl -X GET http://localhost:4000/api/analytics/users/count \
  -b cookies.txt
```

---

#### 2. Lấy Tăng Trưởng Người Dùng

Lấy tăng trưởng người dùng theo thời gian.

**Endpoint**: `GET /api/analytics/users/growth`
**Xác thực**: Yêu cầu (Admin)

**Tham số Query**:
- `startDate` (tùy chọn): Ngày bắt đầu (ISO 8601)
- `endDate` (tùy chọn): Ngày kết thúc (ISO 8601)
- `interval` (tùy chọn): `day`, `week`, `month` (mặc định: `day`)

**Response Thành Công** (200 OK):
```json
{
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-29T23:59:59.000Z",
    "interval": "day"
  },
  "data": [
    {
      "date": "2025-10-01",
      "newUsers": 45,
      "totalUsers": 1000
    },
    {
      "date": "2025-10-02",
      "newUsers": 52,
      "totalUsers": 1052
    }
  ],
  "totalGrowth": 234,
  "averageDaily": 8.1
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/analytics/users/growth?interval=day&startDate=2025-10-01" \
  -b cookies.txt
```

---

#### 3. Lấy Người Dùng Hoạt Động

Lấy thống kê người dùng hoạt động.

**Endpoint**: `GET /api/analytics/users/active`
**Xác thực**: Yêu cầu (Admin)

**Tham số Query**:
- `period` (tùy chọn): `day`, `week`, `month` (mặc định: `day`)

**Response Thành Công** (200 OK):
```json
{
  "period": "day",
  "activeUsers": 450,
  "totalUsers": 1234,
  "activityRate": 36.5,
  "byPlan": {
    "free": 300,
    "pro": 120,
    "enterprise": 30
  }
}
```

**Ví dụ cURL**:
```bash
curl -X GET "http://localhost:4000/api/analytics/users/active?period=week" \
  -b cookies.txt
```

---

## Mã Lỗi

Tất cả endpoint tuân theo mã trạng thái HTTP chuẩn và trả về định dạng lỗi nhất quán.

### Mã Thành Công

- `200 OK`: Yêu cầu thành công
- `201 Created`: Tạo tài nguyên thành công
- `204 No Content`: Yêu cầu thành công, không có nội dung trả về

### Mã Lỗi Client

- `400 Bad Request`: Tham số hoặc body yêu cầu không hợp lệ
- `401 Unauthorized`: Yêu cầu xác thực hoặc session không hợp lệ
- `403 Forbidden`: Không đủ quyền
- `404 Not Found`: Không tìm thấy tài nguyên
- `409 Conflict`: Tài nguyên đã tồn tại hoặc xung đột
- `422 Unprocessable Entity`: Lỗi xác thực
- `429 Too Many Requests`: Vượt quá giới hạn tốc độ

### Mã Lỗi Server

- `500 Internal Server Error`: Lỗi server không mong đợi
- `502 Bad Gateway`: Dịch vụ upstream không khả dụng
- `503 Service Unavailable`: Dịch vụ tạm thời không khả dụng
- `504 Gateway Timeout`: Dịch vụ upstream timeout

### Định Dạng Response Lỗi

Tất cả lỗi trả về định dạng JSON nhất quán:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không hợp lệ",
    "details": {
      "field": "password"
    }
  }
}
```

### Các Mã Lỗi Thường Gặp

| Mã | Mô Tả |
|------|-------------|
| `INVALID_CREDENTIALS` | Email hoặc mật khẩu không hợp lệ |
| `EMAIL_NOT_VERIFIED` | Địa chỉ email chưa được xác thực |
| `EMAIL_ALREADY_EXISTS` | Email đã được đăng ký |
| `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn |
| `INSUFFICIENT_CREDITS` | Không đủ token credits |
| `RATE_LIMIT_EXCEEDED` | Quá nhiều yêu cầu |
| `RESOURCE_NOT_FOUND` | Không tìm thấy tài nguyên được yêu cầu |
| `UNAUTHORIZED_ACCESS` | Không đủ quyền |
| `VALIDATION_ERROR` | Xác thực yêu cầu thất bại |
| `PAYMENT_FAILED` | Xử lý thanh toán thất bại |
| `SUBSCRIPTION_REQUIRED` | Yêu cầu gói đăng ký |
| `PROVIDER_ERROR` | Lỗi AI provider |
| `SERVICE_UNAVAILABLE` | Dịch vụ tạm thời không khả dụng |

---

## Giới Hạn Tốc Độ

### Giới Hạn Tốc Độ Toàn Cục

Tất cả yêu cầu đã xác thực đều chịu giới hạn tốc độ toàn cục:
- **100 yêu cầu mỗi phút** mỗi người dùng

### Giới Hạn Tốc Độ Cụ Thể Theo Endpoint

Một số endpoint có giới hạn tốc độ bổ sung:

| Endpoint | Giới Hạn Tốc Độ |
|----------|------------|
| `POST /api/auth/signup` | 5 mỗi 15 phút |
| `POST /api/auth/signin` | 10 mỗi 15 phút |
| `POST /api/auth/verify-email` | 20 mỗi giờ |
| `POST /api/auth/forgot-password` | 3 mỗi giờ |
| `POST /api/auth/reset-password` | 3 mỗi giờ |
| `POST /api/auth/resend-verification` | 3 mỗi giờ |

### Header Giới Hạn Tốc Độ

Tất cả response bao gồm thông tin giới hạn tốc độ:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698567890
```

### Response Vượt Quá Giới Hạn Tốc Độ

Khi vượt quá giới hạn tốc độ, bạn sẽ nhận được:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
    "retryAfter": 60
  }
}
```

---

## Kiểm Tra Với cURL

### Ví Dụ Luồng Xác Thực

```bash
# 1. Đăng ký
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Người Dùng Test"}'

# 2. Đăng nhập và lưu cookies
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Lấy thông tin người dùng hiện tại
curl -X GET http://localhost:4000/api/auth/me \
  -b cookies.txt

# 4. Gửi tin nhắn chat
curl -X POST http://localhost:4000/api/chat/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Xin chào!","provider":"openai","model":"gpt-4"}'

# 5. Lấy thông tin billing
curl -X GET http://localhost:4000/api/billing/subscription \
  -b cookies.txt

# 6. Đăng xuất
curl -X POST http://localhost:4000/api/auth/signout \
  -b cookies.txt
```

---

## Tài Nguyên Bổ Sung

### Health Checks Dịch Vụ

Mỗi dịch vụ cung cấp endpoint health check:

- **API Gateway**: `GET http://localhost:4000/health`
- **Dịch vụ Auth**: `GET http://localhost:3001/health`
- **Dịch vụ Chat**: `GET http://localhost:3002/health`
- **Dịch vụ Billing**: `GET http://localhost:3003/health`
- **Dịch vụ Analytics**: `GET http://localhost:3004/health`

### Prometheus Metrics

Metrics có sẵn tại:
- **API Gateway**: `GET http://localhost:4000/metrics`

### Tài Liệu

Để biết thêm thông tin, xem:
- `README.md` - Tổng quan dự án
- `BACKEND_ONLY_ARCHITECTURE.md` - Kiến trúc backend đầy đủ
- `BACKEND_ROADMAP.md` - Lộ trình phát triển
- `docs/` - Hướng dẫn và tài liệu bổ sung

---

**Tạo**: 29 tháng 10, 2025
**Phiên bản Backend**: 1.0.0
**Tổng Endpoints**: 47

Nếu có câu hỏi hoặc vấn đề, vui lòng tham khảo tài liệu dự án hoặc liên hệ với nhóm phát triển.
