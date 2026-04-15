import { Router } from 'express';
import { getBatchVerificationQr, verifyBatch } from '../controllers/batchController';

const router = Router();

/**
 * Verification Routes
 * Base path: /api/pharma/verify
 */

// Verify batch by ID (public endpoint)
router.get('/:batchId/qr', getBatchVerificationQr);

// Verify batch by ID (public endpoint)
router.get('/:batchId', verifyBatch);

export default router;
