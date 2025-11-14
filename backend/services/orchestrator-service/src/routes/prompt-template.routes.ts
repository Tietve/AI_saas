import { Router } from 'express';
import {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  startRollout,
  incrementRollout,
  rollbackTemplate,
  getMetrics,
  compareVersions,
  getRolloutHistory,
  getABTestingDashboard,
} from '../controllers/prompt-template.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createPromptTemplateSchema,
  updatePromptTemplateSchema,
  rolloutPromptSchema
} from '../validation/orchestrator.validation';

const router = Router();

// Dashboard (must come before /:id routes)
router.get('/dashboard/ab-testing', getABTestingDashboard);

// CRUD operations
router.post('/', validate(createPromptTemplateSchema, 'body'), createTemplate);
router.get('/', listTemplates);
router.get('/:id', getTemplate);
router.patch('/:id', validate(updatePromptTemplateSchema, 'body'), updateTemplate);
router.delete('/:id', deleteTemplate);

// Version comparison
router.get('/:name/compare', compareVersions);

// Rollout management
router.post('/:id/rollout/start', validate(rolloutPromptSchema, 'body'), startRollout);
router.post('/:id/rollout/increment', incrementRollout);
router.post('/:id/rollback', rollbackTemplate);

// Metrics & History
router.get('/:id/metrics', getMetrics);
router.get('/:id/history', getRolloutHistory);

export default router;
