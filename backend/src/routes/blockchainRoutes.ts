import { Router } from 'express';
import {
  getStatus,
  verifyHashEndpoint,
  verifyDataEndpoint,
  getHashes,
  generateHashEndpoint,
  getBatchProofEndpoint
} from '../controllers/blockchainController';

const router = Router();

/**
 * @route   GET /api/blockchain/status
 * @desc    Get blockchain connection status and statistics
 * @access  Public
 */
router.get('/status', getStatus);

/**
 * @route   GET /api/blockchain/verify/:hash
 * @desc    Verify if a hash exists on blockchain
 * @access  Public
 */
router.get('/verify/:hash', verifyHashEndpoint);

/**
 * @route   POST /api/blockchain/verify-data
 * @desc    Verify if data matches a hash
 * @access  Public
 */
router.post('/verify-data', verifyDataEndpoint);

/**
 * @route   GET /api/blockchain/hashes
 * @desc    Get all hashes stored on blockchain
 * @access  Public
 */
router.get('/hashes', getHashes);

/**
 * @route   POST /api/blockchain/generate-hash
 * @desc    Generate hash from data (without storing)
 * @access  Public
 */
router.post('/generate-hash', generateHashEndpoint);

/**
 * @route   GET /api/blockchain/proof-batch/:batchId
 * @desc    Get blockchain proof details for a batch
 * @access  Public
 */
router.get('/proof-batch/:batchId', getBatchProofEndpoint);

export default router;
