import { NextResponse } from 'next/server';
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway';

export async function GET() {
    const gateway = new MultiProviderGateway({
        openai: process.env.OPENAI_API_KEY!,
        claude: process.env.ANTHROPIC_API_KEY!
    });

    const health = await gateway.checkProvidersHealth();

    return NextResponse.json({
        providers: health,
        timestamp: new Date().toISOString()
    });
}
