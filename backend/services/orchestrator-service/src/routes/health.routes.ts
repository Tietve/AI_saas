import { Router } from 'express';
import {
  healthCheck,
  databaseHealthCheck,
  redisHealthCheck,
  vectorStoreHealthCheck,
  allHealthChecks,
} from '../controllers/health.controller';

const router = Router();

// Basic health check
router.get('/', healthCheck);

// Individual service checks
router.get('/db', databaseHealthCheck);
router.get('/redis', redisHealthCheck);
router.get('/vector', vectorStoreHealthCheck); // pgvector health check

// All services check
router.get('/all', allHealthChecks);

export default router;
