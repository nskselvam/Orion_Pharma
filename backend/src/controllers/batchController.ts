import pool, { query } from '../config/database';
import {
  CreateBatchRequest
} from '../types/pharma.types';
import { Request, Response } from 'express';
import { storeHashLocal } from '../utils/blockchainService';
import { startSimulation, stopSimulation, STAGE_COORDINATES } from '../utils/simulationService';

/**
 * Batch Controller
 * Handles CRUD operations for medicine batches
 */

/**
 * Create new batch
 * POST /api/pharma/batch/create
 */
export const createBatch = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      batchId,
      medicineName,
      origin,
      destination,
      originCoordinates,
      destinationCoordinates,
      quantityInStock,
      temperature,
      targetTempMin,
      targetTempMax
    }: CreateBatchRequest = req.body;

    // Validate required fields
    if (!batchId || !medicineName || !origin || !destination) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: batchId, medicineName, origin, destination'
      });
      return;
    }

    await client.query('BEGIN');

    // Check if batch already exists
    const existingBatch = await client.query(
      'SELECT id FROM batches WHERE batch_id = $1',
      [batchId.toUpperCase()]
    );

    if (existingBatch.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        error: 'Batch with this ID already exists'
      });
      return;
    }

    const manufacturerInfo = STAGE_COORDINATES.manufacturer;
    const tempValue = temperature || 22;

    // Create batch
    const batchResult = await client.query(
      `INSERT INTO batches (
        batch_id, medicine_name, origin, origin_lat, origin_lng,
        destination, destination_lat, destination_lng,
        quantity_in_stock, temperature, target_temp_min, target_temp_max
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        batchId.toUpperCase(),
        medicineName,
        origin,
        originCoordinates?.lat,
        originCoordinates?.lng,
        destination,
        destinationCoordinates?.lat,
        destinationCoordinates?.lng,
        quantityInStock || null,
        tempValue,
        targetTempMin || 15,
        targetTempMax || 30
      ]
    );

    const batch = batchResult.rows[0];

    // Create initial stage
    await client.query(
      `INSERT INTO batch_stages (
        batch_id, name, location, temperature, coordinates_lat, coordinates_lng
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        batch.batch_id,
        manufacturerInfo.name,
        'manufacturer',
        tempValue,
        manufacturerInfo.lat,
        manufacturerInfo.lng
      ]
    );

    // Create initial log
    await client.query(
      `INSERT INTO logs (batch_id, type, value)
      VALUES ($1, $2, $3)`,
      [
        batch.batch_id,
        'temperature',
        JSON.stringify({ temperature: tempValue, message: 'Initial temperature reading' })
      ]
    );

    // Store initial hash on blockchain (local)
    const hashResult = await storeHashLocal({
      batchId: batch.batch_id,
      action: 'created',
      temperature: tempValue,
      timestamp: new Date()
    });

    // Update batch with blockchain hash
    await client.query(
      'UPDATE batches SET blockchain_hash = $1 WHERE batch_id = $2',
      [hashResult.hash, batch.batch_id]
    );

    await client.query('COMMIT');

    // Start auto-simulation for this batch
    startSimulation(batch.batch_id);

    res.status(201).json({
      success: true,
      data: {
        batchId: batch.batch_id,
        medicineName: batch.medicine_name,
        origin: batch.origin,
        destination: batch.destination,
        originCoordinates: {
          lat: batch.origin_lat,
          lng: batch.origin_lng
        },
        destinationCoordinates: {
          lat: batch.destination_lat,
          lng: batch.destination_lng
        },
        quantityInStock: batch.quantity_in_stock,
        currentStage: batch.current_stage,
        temperature: parseFloat(batch.temperature),
        targetTempMin: parseFloat(batch.target_temp_min),
        targetTempMax: parseFloat(batch.target_temp_max),
        temperatureBreaches: batch.temperature_breaches || 0,
        trustScore: batch.trust_score,
        status: batch.status,
        blockchainHash: hashResult.hash
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create batch'
    });
  } finally {
    client.release();
  }
};

/**
 * Get all batches
 * GET /api/pharma/batch
 */
export const getAllBatches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT 
        batch_id, medicine_name, origin, origin_lat, origin_lng,
        destination, destination_lat, destination_lng,
        quantity_in_stock, current_stage, temperature,
        target_temp_min, target_temp_max, temperature_breaches,
        trust_score, status, created_at, updated_at
      FROM batches
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(batch => ({
        batchId: batch.batch_id,
        medicineName: batch.medicine_name,
        origin: batch.origin,
        destination: batch.destination,
        originCoordinates: {
          lat: batch.origin_lat,
          lng: batch.origin_lng
        },
        destinationCoordinates: {
          lat: batch.destination_lat,
          lng: batch.destination_lng
        },
        quantityInStock: batch.quantity_in_stock,
        currentStage: batch.current_stage,
        temperature: parseFloat(batch.temperature),
        targetTempMin: parseFloat(batch.target_temp_min),
        targetTempMax: parseFloat(batch.target_temp_max),
        temperatureBreaches: batch.temperature_breaches || 0,
        trustScore: batch.trust_score,
        status: batch.is_recalled ? 'recalled' : batch.status,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve batches'
    });
  }
};

/**
 * Get single batch with details
 * GET /api/pharma/batch/:id
 */
export const getBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = String(req.params.id).toUpperCase();

    // Get batch
    const batchResult = await query(
      'SELECT * FROM batches WHERE batch_id = $1',
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

    // Get stages
    const stagesResult = await query(
      `SELECT * FROM batch_stages 
       WHERE batch_id = $1 
       ORDER BY timestamp ASC`,
      [batchId]
    );

    // Get temperature history
    const tempLogsResult = await query(
      `SELECT * FROM logs 
       WHERE batch_id = $1 AND type = 'temperature'
       ORDER BY timestamp DESC
       LIMIT 50`,
      [batchId]
    );

    // Get alerts
    const alertsResult = await query(
      `SELECT * FROM alerts
       WHERE batch_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [batchId]
    );

    res.json({
      success: true,
      data: {
        batchId: batch.batch_id,
        medicineName: batch.medicine_name,
        origin: batch.origin,
        destination: batch.destination,
        originCoordinates: {
          lat: batch.origin_lat,
          lng: batch.origin_lng
        },
        destinationCoordinates: {
          lat: batch.destination_lat,
          lng: batch.destination_lng
        },
        quantityInStock: batch.quantity_in_stock,
        currentStage: batch.current_stage,
        temperature: parseFloat(batch.temperature),
        targetTempMin: parseFloat(batch.target_temp_min),
        targetTempMax: parseFloat(batch.target_temp_max),
        temperatureBreaches: batch.temperature_breaches || 0,
        trustScore: batch.trust_score,
        status: batch.is_recalled ? 'recalled' : batch.status,
        blockchainHash: batch.blockchain_hash,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at,
        temperatureHistory: tempLogsResult.rows.map(log => ({
          timestamp: log.timestamp,
          temperature: typeof log.value === 'object' ? log.value.temperature : log.value,
          blockchainHash: log.blockchain_hash
        })),
        alerts: alertsResult.rows.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.created_at,
          resolved: alert.resolved
        })),
        stages: stagesResult.rows.map(stage => ({
          name: stage.name,
          location: stage.location,
          timestamp: stage.timestamp,
          temperature: stage.temperature ? parseFloat(stage.temperature) : null,
          coordinates: {
            lat: stage.coordinates_lat,
            lng: stage.coordinates_lng
          }
        }))
      }
    });
  } catch (error: any) {
    console.error('Get batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve batch'
    });
  }
};

/**
 * Verify batch (public endpoint)
 * GET /api/pharma/verify/:batchId
 */
export const verifyBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = String(req.params.batchId).toUpperCase();

    const batchResult = await query(
      'SELECT * FROM batches WHERE batch_id = $1',
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

    // Get logs
    const logsResult = await query(
      `SELECT * FROM logs
       WHERE batch_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [batchId]
    );

    // Get active alerts
    const activeAlertsResult = await query(
      `SELECT * FROM alerts
       WHERE batch_id = $1 AND resolved = false`,
      [batchId]
    );

    // Get stages
    const stagesResult = await query(
      `SELECT * FROM batch_stages
       WHERE batch_id = $1
       ORDER BY timestamp ASC`,
      [batchId]
    );

    const trustStatus = batch.trust_score >= 80 ? 'SAFE' : batch.trust_score >= 50 ? 'RISKY' : 'UNSAFE';

    res.json({
      success: true,
      data: {
        batchId: batch.batch_id,
        medicineName: batch.medicine_name,
        origin: batch.origin,
        destination: batch.destination,
        currentStage: batch.current_stage,
        temperature: parseFloat(batch.temperature),
        quantityInStock: batch.quantity_in_stock,
        targetTempMin: parseFloat(batch.target_temp_min),
        targetTempMax: parseFloat(batch.target_temp_max),
        temperatureBreaches: batch.temperature_breaches || 0,
        targetTempRange: {
          min: parseFloat(batch.target_temp_min),
          max: parseFloat(batch.target_temp_max)
        },
        trustScore: batch.trust_score,
        trustStatus,
        status: batch.is_recalled ? 'recalled' : batch.status,
        blockchainHash: batch.blockchain_hash,
        verified: !!batch.blockchain_hash,
        activeAlerts: activeAlertsResult.rows.length,
        totalLogs: logsResult.rows.length,
        journey: stagesResult.rows.map(stage => ({
          stage: stage.name,
          location: stage.location,
          timestamp: stage.timestamp,
          temperature: stage.temperature ? parseFloat(stage.temperature) : null
        }))
      }
    });
  } catch (error: any) {
    console.error('Verify batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify batch'
    });
  }
};

/**
 * Delete batch and related data
 * DELETE /api/pharma/batch/:id
 */
export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const batchId = String(req.params.id).toUpperCase();

    await client.query('BEGIN');

    const batchResult = await client.query(
      'SELECT id FROM batches WHERE batch_id = $1',
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    // Stop simulation
    stopSimulation(batchId);

    // Delete batch (cascades to stages, alerts, logs)
    await client.query('DELETE FROM batches WHERE batch_id = $1', [batchId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Batch ${batchId} deleted successfully`
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete batch'
    });
  } finally {
    client.release();
  }
};

/**
 * Recall batch and notify stakeholders
 * POST /api/pharma/batch/:id/recall
 */
export const recallBatch = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const batchId = String(req.params.id).toUpperCase();
    const recalledBy = String(req.body?.recalledBy || 'admin');

    await client.query('BEGIN');

    const batchResult = await client.query(
      'SELECT * FROM batches WHERE batch_id = $1',
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Batch not found' });
      return;
    }

    const batch = batchResult.rows[0];
    if (batch.is_recalled) {
      await client.query('ROLLBACK');
      res.status(409).json({ success: false, error: 'Batch already recalled' });
      return;
    }

    await client.query(
      `UPDATE batches
       SET is_recalled = true,
           trust_score = LEAST(trust_score, 30),
           updated_at = CURRENT_TIMESTAMP
       WHERE batch_id = $1`,
      [batchId]
    );

    const stakeholderMessages = [
      `Manufacturer notified for recall of ${batchId}`,
      `Distributor notified for recall of ${batchId}`,
      `Pharmacy notified for recall of ${batchId}`,
      `Admin acknowledged recall for ${batchId}`
    ];

    for (const message of stakeholderMessages) {
      await client.query(
        `INSERT INTO alerts (batch_id, type, severity, message, details)
         VALUES ($1, 'trust_critical', 'critical', $2, $3::jsonb)`,
        [
          batchId,
          message,
          JSON.stringify({
            event: 'batch_recall',
            recalledBy,
            batchId,
            timestamp: new Date().toISOString()
          })
        ]
      );
    }

    await client.query(
      `INSERT INTO logs (batch_id, type, value, previous_value)
       VALUES ($1, 'alert', $2::jsonb, $3::jsonb)`,
      [
        batchId,
        JSON.stringify({ event: 'batch_recalled', recalledBy }),
        JSON.stringify({ previousStatus: batch.status, wasRecalled: false })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Batch ${batchId} has been recalled successfully`,
      data: {
        batchId,
        status: 'recalled',
        recalledBy,
        stakeholdersNotified: stakeholderMessages.length,
        notifications: stakeholderMessages
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message || 'Failed to recall batch' });
  } finally {
    client.release();
  }
};
