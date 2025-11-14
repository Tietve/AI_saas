// scripts/resetMonthlyUsage.ts
import 'dotenv/config'                     // để load .env khi chạy bằng node/tsx
import { prisma } from '../src/lib/prisma'

async function main() {
    const res = await prisma.user.updateMany({ data: { monthlyTokenUsed: 0 } })
    console.log(`[resetMonthlyUsage] Updated users: ${res.count}`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
