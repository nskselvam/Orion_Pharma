import { Request, Response } from 'express';
import { query } from '../config/database';

/**
 * Alert Controller
 * Handles alert management
 */

/**
 * Get all alerts
 * GET /api/pharma/alerts
 */
export const getAllAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolved, limit = '50' } = req.query;

    let queryText = `
      SELECT a.*, b.medicine_name, b.current_stage
      FROM alerts a
      LEFT JOIN batches b ON a.batch_id = b.batch_id
    `;

    const params: any[] = [];
    if (resolved !== undefined) {
      queryText += ` WHERE a.resolved = $1`;
      params.push(resolved === 'true');
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        batchId: row.batch_id,
        medicineName: row.medicine_name,
        currentStage: row.current_stage,
        type: row.type,
        severity: row.severity,
        message: row.message,
        details: row.details,
        resolved: row.resolved,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve alerts'
    });
  }
};

/**
 * Get alerts for specific batch
 * GET /api/pharma/alerts/batch/:batchId
 */
export const getBatchAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const { resolved, limit = '20' } = req.query;

    let queryText = `SELECT * FROM alerts WHERE batch_id = $1`;
    const params: any[] = [String(batchId).toUpperCase()];

    if (resolved !== undefined) {
      queryText += ` AND resolved = $2`;
      params.push(resolved === 'true');
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        severity: row.severity,
        message: row.message,
        details: row.details,
        resolved: row.resolved,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error('Get batch alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve batch alerts'
    });
  }
};

/**
 * Get active (unresolved) alerts
 * GET /api/pharma/alerts/active
 */
export const getActiveAlerts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT a.*, b.medicine_name, b.current_stage
      FROM alerts a
      LEFT JOIN batches b ON a.batch_id = b.batch_id
      WHERE a.resolved = false
      ORDER BY a.created_at DESC
    `);

    const alerts = result.rows;

    // Count by severity
    const severityCount = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };

    res.json({
      success: true,
      count: alerts.length,
      severityCount,
      data: alerts.map(row => ({
        id: row.id,
        batchId: row.batch_id,
        medicineName: row.medicine_name,
        currentStage: row.current_stage,
        type: row.type,
        severity: row.severity,
        message: row.message,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve active alerts'
    });
  }
};

/**
 * Resolve an alert
 * PATCH /api/pharma/alerts/:id/resolve
 */
export const resolveAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE alerts 
       SET resolved = true, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve alert'
    });
  }
};

/**
 * Create alert manually
 * POST /api/pharma/alerts
 */
export const createAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId, type, severity, message, details } = req.body;

    if (!batchId || !type || !severity || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: batchId, type, severity, message'
      });
      return;
    }

    const result = await query(
      `INSERT INTO alerts (batch_id, type, severity, message, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [batchId.toUpperCase(), type, severity, message, details || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert'
    });
  }
};
