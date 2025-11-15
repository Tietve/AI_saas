# 📡 API ENDPOINTS REFERENCE

## Auth Service

### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "username": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

---

## User Service

### GET /api/users/me
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "username": "...",
    "createdAt": "..."
  }
}
```

---

## Chat Service

### POST /api/chats
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "type": "direct",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

### POST /api/messages
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "chatId": "...",
  "content": "Hello!"
}
```

---

**💡 Usage:**
```
"Đọc .claude/API_ENDPOINTS.md và test tất cả endpoints"
```
