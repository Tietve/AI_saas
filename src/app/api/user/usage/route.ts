import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            monthlyTokenUsed: true,
            planTier: true
        }
    });

    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.tokenUsage.aggregate({
        where: {
            userId: session.user.id,
            createdAt: {
                gte: startOfMonth
            }
        },
        _sum: {
            tokensIn: true,
            tokensOut: true,
            costUsd: true
        }
    });

    
    const limits = {
        FREE: 10000,
        PLUS: 100000,
        PRO: 1000000
    };

    return NextResponse.json({
        monthlyTokenUsed: user?.monthlyTokenUsed || 0,
        planTier: user?.planTier || 'FREE',
        limit: limits[user?.planTier || 'FREE'],
        currentMonth: {
            tokensIn: usage._sum.tokensIn || 0,
            tokensOut: usage._sum.tokensOut || 0,
            costUsd: usage._sum.costUsd || 0
        }
    });
}