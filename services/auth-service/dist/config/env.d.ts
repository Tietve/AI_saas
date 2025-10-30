import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    RABBITMQ_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    DATABASE_URL?: string | undefined;
    REDIS_URL?: string | undefined;
    RABBITMQ_URL?: string | undefined;
}, {
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
    DATABASE_URL?: string | undefined;
    REDIS_URL?: string | undefined;
    RABBITMQ_URL?: string | undefined;
}>;
export declare const config: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    DATABASE_URL?: string | undefined;
    REDIS_URL?: string | undefined;
    RABBITMQ_URL?: string | undefined;
};
export type Config = z.infer<typeof envSchema>;
export {};
//# sourceMappingURL=env.d.ts.map