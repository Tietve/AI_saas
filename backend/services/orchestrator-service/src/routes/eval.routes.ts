import { Router } from 'express';
import {
  createDataset,
  addQuestion,
  runEval,
  getEvalResults,
  listDatasets,
  getDataset,
  getEvalHistory,
} from '../controllers/eval.controller';

const router = Router();

// Dataset management
router.post('/datasets', createDataset);
router.get('/datasets', listDatasets);
router.get('/datasets/:id', getDataset);

// Question management
router.post('/datasets/:id/questions', addQuestion);

// Run evaluations
router.post('/run', runEval);

// Results
router.get('/results/:runId', getEvalResults);
router.get('/history', getEvalHistory);

export default router;
