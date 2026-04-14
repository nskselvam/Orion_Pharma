import { Router } from 'express';
import { getRiskPredictions, getBatchRiskPrediction } from '../controllers/riskController';

const router = Router();

router.get('/predictions', getRiskPredictions);
router.get('/predictions/:batchId', getBatchRiskPrediction);

export default router;
