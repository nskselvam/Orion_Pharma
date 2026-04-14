import { Request, Response } from 'express';
import {
  getBlockchainStatus,
  verifyHashOnBlockchain,
  getAllHashes,
  generateHash,
  verifyHash,
  getBlockchainProof
} from '../utils/blockchainService';
import { query } from '../config/database';

/**
 * Get blockchain connection status and statistics
 */
export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await getBlockchainStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain status',
      message: error.message
    });
  }
};

/**
 * Verify a hash exists on blockchain
 */
export const verifyHashEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;

    if (!hash || typeof hash !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Hash parameter is required and must be a string'
      });
      return;
    }

    const result = await verifyHashOnBlockchain(hash);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error verifying hash:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify hash',
      message: error.message
    });
  }
};

/**
 * Verify data matches a hash
 */
export const verifyDataEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, hash } = req.body;

    if (!data || !hash) {
      res.status(400).json({
        success: false,
        error: 'Both data and hash are required'
      });
      return;
    }

    const matches = verifyHash(data, hash);
    const computedHash = generateHash(data);
    
    res.json({
      success: true,
      data: {
        matches,
        computedHash,
        providedHash: hash
      }
    });
  } catch (error: any) {
    console.error('Error verifying data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify data',
      message: error.message
    });
  }
};

/**
 * Get all hashes stored on blockchain
 */
export const getHashes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllHashes();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting hashes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hashes',
      message: error.message
    });
  }
};

/**
 * Generate a hash from data (without storing)
 */
export const generateHashEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data) {
      res.status(400).json({
        success: false,
        error: 'Data is required'
      });
      return;
    }

    const hash = generateHash(data);
    
    res.json({
      success: true,
      data: {
        hash,
        data
      }
    });
  } catch (error: any) {
    console.error('Error generating hash:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate hash',
      message: error.message
    });
  }
};

/**
 * Get blockchain proof details for a batch (hash + tx + events)
 */
export const getBatchProofEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = String(req.params.batchId || '').toUpperCase();

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: 'batchId parameter is required'
      });
      return;
    }

    const batchResult = await query(
      'SELECT batch_id, blockchain_hash FROM batches WHERE batch_id = $1',
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const batch = batchResult.rows[0];
    if (!batch.blockchain_hash) {
      res.json({
        success: true,
        data: {
          batchId: batch.batch_id,
          available: false,
          message: 'No blockchain hash stored for this batch'
        }
      });
      return;
    }

    const proof = await getBlockchainProof(batch.blockchain_hash);

    res.json({
      success: true,
      data: {
        batchId: batch.batch_id,
        available: true,
        ...proof
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get batch blockchain proof',
      message: error.message
    });
  }
};
