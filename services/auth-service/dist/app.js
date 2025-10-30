"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const prom_client_1 = require("prom-client");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ level: env_1.config.LOG_LEVEL || 'info' });
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, pino_http_1.default)({ logger }));
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'auth-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prom_client_1.register.contentType);
    res.end(await prom_client_1.register.metrics());
});
// Routes
// TODO: Import and mount routes here
// Error handling
app.use((err, req, res, next) => {
    logger.error(err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});
// Start server
const PORT = env_1.config.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`auth-service listening on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=app.js.map