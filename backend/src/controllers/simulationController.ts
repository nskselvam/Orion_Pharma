import { Request, Response } from 'express';
import pool, { query } from '../config/database';
import { BatchStage } from '../types/pharma.types';
import { STAGE_COORDINATES } from '../utils/simulationService';

/**
 * Simulation Controller
 * Handles manual simulation triggers for demo purposes
 */

/**
 * Generate random temperature based on options
 */
const generateTemperature = (currentTemp: number, options: {
  breach?: boolean;
  spike?: boolean;
  manualValue?: number;
} = {}): number => {
  if (options.manualValue !== undefined) {
    return options.manualValue;
  }

  if (options.breach) {
    // Simulate breach: temperature outside safe range
    return Math.random() > 0.5 ? 35 + Math.random() * 5 : 5 + Math.random() * 5;
  }

  if (options.spike) {
    // Simulate spike: sudden temperature change
    return currentTemp + (Math.random() - 0.5) * 10;
  }

  // Normal variation: ±2 degrees
  const variation = (Math.random() - 0.5) * 4;
  return Math.max(15, Math.min(30, currentTemp + variation));
};

/**
 * Calculate trust score impact
 */
const calculateTrustScoreImpact = (
  temperature: number,
  targetTempMin: number,
  targetTempMax: number
): number => {
  if (temperature < targetTempMin || temperature > targetTempMax) {
    return -30; // Temperature breach
  }
  if (temperature >= targetTempMin + 2 && temperature <= targetTempMax - 2) {
    return 2; // Stability bonus
  }
  return 0;
};

/**
 * Simulate temperature change
 * POST /api/pharma/simulate/temperature
 */
export const simulateTemperature = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { batchId, breach, spike, value } = req.body;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: 'batchId is required'
      });
      return;
    }

    await client.query('BEGIN');

    const batchResult = await client.query(
      'SELECT * FROM batches WHERE batch_id = $1',
      [batchId.toUpperCase()]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const batch = batchResult.rows[0];
    const currentTemp = parseFloat(batch.temperature);

    const options = {
      breach: breach === true,
      spike: spike === true,
      manualValue: typeof value === 'number' ? value : undefined
    };

    const newTemperature = generateTemperature(currentTemp, options);
    const trustScoreImpact = calculateTrustScoreImpact(
      newTemperature,
      parseFloat(batch.target_temp_min),
      parseFloat(batch.target_temp_max)
    );

    const newTrustScore = Math.max(0, Math.min(100, batch.trust_score + trustScoreImpact));

    // Update batch
    await client.query(
      `UPDATE batches 
       SET temperature = $1, trust_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE batch_id = $3`,
      [newTemperature, newTrustScore, batch.batch_id]
    );

    // Create log
    await client.query(
      `INSERT INTO logs (batch_id, type, value, previous_value)
       VALUES ($1, $2, $3, $4)`,
      [
        batch.batch_id,
        'temperature',
        JSON.stringify({ temperature: newTemperature }),
        JSON.stringify({ temperature: currentTemp })
      ]
    );

    // Create alert if breach
    if (trustScoreImpact < 0) {
      await client.query(
        `INSERT INTO alerts (batch_id, type, severity, message, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          batch.batch_id,
          'temperature_breach',
          'high',
          `Temperature breach detected: ${newTemperature.toFixed(1)}°C`,
          JSON.stringify({
            temperature: newTemperature,
            targetMin: batch.target_temp_min,
            targetMax: batch.target_temp_max
          })
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: breach || spike
        ? `Temperature breach simulated: ${newTemperature.toFixed(1)}°C`
        : `Temperature updated: ${newTemperature.toFixed(1)}°C`,
      data: {
        batchId: batch.batch_id,
        temperature: newTemperature,
        previousTemperature: currentTemp,
        trustScore: newTrustScore,
        trustScoreChange: trustScoreImpact
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Simulate temperature error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to simulate temperature'
    });
  } finally {
    client.release();
  }
};

/**
 * Move batch to next stage
 * POST /api/pharma/simulate/location
 */
export const simulateLocation = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { batchId } = req.body;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: 'batchId is required'
      });
      return;
    }

    await client.query('BEGIN');

    const batchResult = await client.query(
      'SELECT * FROM batches WHERE batch_id = $1',
      [batchId.toUpperCase()]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const batch = batchResult.rows[0];
    const currentStage = batch.current_stage as BatchStage;

    // Determine next stage
    const stageOrder: BatchStage[] = ['manufacturer', 'warehouse', 'distributor', 'pharmacy'];
    const currentIndex = stageOrder.indexOf(currentStage);

    if (currentIndex >= stageOrder.length - 1) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'Batch already at final destination (pharmacy)'
      });
      return;
    }

    const nextStage = stageOrder[currentIndex + 1];
    const stageInfo = STAGE_COORDINATES[nextStage];

    // Update batch stage
    await client.query(
      `UPDATE batches 
       SET current_stage = $1, updated_at = CURRENT_TIMESTAMP
       WHERE batch_id = $2`,
      [nextStage, batch.batch_id]
    );

    // Add stage to history
    await client.query(
      `INSERT INTO batch_stages (batch_id, name, location, temperature, coordinates_lat, coordinates_lng)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        batch.batch_id,
        stageInfo.name,
        nextStage,
        batch.temperature,
        stageInfo.lat,
        stageInfo.lng
      ]
    );

    // Create log
    await client.query(
      `INSERT INTO logs (batch_id, type, value, previous_value)
       VALUES ($1, $2, $3, $4)`,
      [
        batch.batch_id,
        'location',
        JSON.stringify({ stage: nextStage, location: stageInfo.name }),
        JSON.stringify({ stage: currentStage })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Moved to ${stageInfo.name}`,
      data: {
        batchId: batch.batch_id,
        currentStage: nextStage,
        location: stageInfo.name,
        coordinates: {
          lat: stageInfo.lat,
          lng: stageInfo.lng
        }
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Simulate location error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to simulate location'
    });
  } finally {
    client.release();
  }
};

/**
 * Get simulation status
 * GET /api/pharma/simulate/status
 */
export const getSimulationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.query;

    if (!batchId) {
      res.status(400).json({
        success: false,
        error: 'batchId is required'
      });
      return;
    }

    const result = await query(
      'SELECT * FROM batches WHERE batch_id = $1',
      [String(batchId).toUpperCase()]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const batch = result.rows[0];

    res.json({
      success: true,
      data: {
        batchId: batch.batch_id,
        currentStage: batch.current_stage,
        temperature: parseFloat(batch.temperature),
        trustScore: batch.trust_score,
        status: batch.status
      }
    });
  } catch (error: any) {
    console.error('Get simulation status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get simulation status'
    });
  }
};
