import { Router } from 'express';
import {
  createBatch,
  getAllBatches,
  getBatch,
  deleteBatch,
  recallBatch
} from '../controllers/batchController';

const router = Router();

/**
 * Batch Routes
 * Base path: /api/pharma/batch
 */

// Create new batch
router.post('/create', createBatch);

// Get all batches
router.get('/', getAllBatches);

// Get single batch
router.get('/:id', getBatch);

// Recall a batch
router.post('/:id/recall', recallBatch);

// Delete batch
router.delete('/:id', deleteBatch);

export default router;
