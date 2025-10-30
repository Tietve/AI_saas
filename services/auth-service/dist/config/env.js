"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3001'),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    DATABASE_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    RABBITMQ_URL: zod_1.z.string().optional(),
});
exports.config = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map