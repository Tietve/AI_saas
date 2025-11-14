# Database Conventions

## Naming
- Tables: PascalCase (User, ChatMessage)
- Columns: camelCase (userId, createdAt)
- Foreign keys: `<table>Id` (userId, chatId)

## Best Practices
- Always use transactions for multi-table operations
- Add indexes on foreign keys
- Use `@default(uuid())` for IDs
- Use `@default(now())` for timestamps
- NEVER delete data, use soft delete (deletedAt)

## Prisma Patterns
```typescript
// Always use select to limit fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, username: true }
})

// Use include for relations
const chat = await prisma.chat.findUnique({
  where: { id },
  include: { participants: true, messages: true }
})
```
