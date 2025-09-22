import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { AIResponse } from './types';

export class SemanticCache {
    private redis: Redis;
    private ttl: number = 3600; 

    constructor(redisUrl: string, redisToken: string) {
        this.redis = new Redis({
            url: redisUrl,
            token: redisToken
        });
    }

    private generateKey(query: string, options?: any): string {
        const normalized = query.toLowerCase().trim();
        const optionsStr = options ? JSON.stringify(options) : '';
        return crypto
            .createHash('sha256')
            .update(normalized + optionsStr)
            .digest('hex');
    }

    async get(query: string, options?: any): Promise<AIResponse | null> {
        const key = this.generateKey(query, options);
        const cached = await this.redis.get<AIResponse>(key);

        if (cached) {
            console.log('Cache hit for query');
            return {
                ...cached,
                latency: 0 
            };
        }

        return null;
    }

    async set(query: string, response: AIResponse, options?: any): Promise<void> {
        const key = this.generateKey(query, options);
        await this.redis.setex(key, this.ttl, response);
    }

    async getSimilar(query: string, threshold: number = 0.9): Promise<AIResponse | null> {
        
        
        return this.get(query);
    }
}