// scripts/dev/quotaSmoke.ts
import 'dotenv/config'
import { prisma } from '../../src/lib/db'
import { getUserLimits, canSpend, recordUsage, getUsageSummary } from '../../src/lib/billing/quota'
import { ModelId, PlanTier } from '@prisma/client'

async function ensureDevUser() {
    await prisma.user.upsert({
        where: { id: 'u_dev' },
        update: {},
        create: {
            id: 'u_dev',
            email: 'dev@example.com',
            emailLower: 'dev@example.com',
            passwordHash: 'dev',
            planTier: PlanTier.FREE,
            monthlyTokenUsed: 0,
        },
    })
}

async function main() {
    await ensureDevUser()

    const limits = await getUserLimits('u_dev')
    console.log('LIMITS:', limits)

    const check = await canSpend('u_dev', 1200)
    console.log('CAN SPEND?', check)

    if ((check as any).ok) {
        const saved = await recordUsage({
            userId: 'u_dev',
            model: ModelId.gpt5_mini,
            tokensIn: 800,
            tokensOut: 400,
            meta: { requestId: 'req-smoke-1' },
        })
        console.log('RECORD USAGE:', saved)
    }

    const summary = await getUsageSummary('u_dev')
    console.log('SUMMARY:', summary)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
