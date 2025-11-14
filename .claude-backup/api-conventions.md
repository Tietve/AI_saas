# API Conventions

## Request Validation
- Always use Joi or Zod
- Validate at controller level
- Return 400 for invalid input

## Error Codes
- `AUTH_001` - Invalid credentials
- `AUTH_002` - Token expired
- `USER_001` - User not found
- `CHAT_001` - Chat not found

## Headers Required
- `Authorization: Bearer <token>` (for authenticated routes)
- `Content-Type: application/json`
