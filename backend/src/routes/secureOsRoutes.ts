import { Router } from 'express';
import { secureVerifyBatch } from '../controllers/secureOsController';

const router = Router();

router.get('/verify/:batchId', secureVerifyBatch);

export default router;
