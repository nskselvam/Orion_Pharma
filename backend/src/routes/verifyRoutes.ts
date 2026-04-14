import { Router } from 'express';
import { verifyBatch } from '../controllers/batchController';

const router = Router();

/**
 * Verification Routes
 * Base path: /api/pharma/verify
 */

// Verify batch by ID (public endpoint)
router.get('/:batchId', verifyBatch);

export default router;
