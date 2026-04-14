import { Request, Response } from 'express';
import { query } from '../config/database';

const stageExpectedHours: Record<string, number> = {
  manufacturer: 12,
  warehouse: 18,
  distributor: 24,
  pharmacy: 6
};

const scoreToBand = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};

const buildPrediction = async (batchId: string) => {
  const [batchResult, tempLogsResult, unresolvedAlertsResult, latestStageResult] = await Promise.all([
    query('SELECT * FROM batches WHERE batch_id = $1', [batchId]),
    query(
      `SELECT timestamp, value
       FROM logs
       WHERE batch_id = $1 AND type = 'temperature'
       ORDER BY timestamp DESC
       LIMIT 5`,
      [batchId]
    ),
    query('SELECT COUNT(*)::int AS count FROM alerts WHERE batch_id = $1 AND resolved = false', [batchId]),
    query('SELECT timestamp FROM batch_stages WHERE batch_id = $1 ORDER BY timestamp DESC LIMIT 1', [batchId])
  ]);

  if (batchResult.rows.length === 0) return null;

  const batch = batchResult.rows[0];
  const currentTemp = Number(batch.temperature);
  const min = Number(batch.target_temp_min);
  const max = Number(batch.target_temp_max);

  const tempSeries = tempLogsResult.rows
    .map((row: any) => {
      const v = typeof row.value === 'object' ? Number(row.value.temperature) : Number(row.value);
      return Number.isFinite(v) ? v : null;
    })
    .filter((v: number | null): v is number => v !== null)
    .reverse();

  const trendDelta = tempSeries.length >= 2 ? tempSeries[tempSeries.length - 1] - tempSeries[0] : 0;
  const outOfRange = currentTemp < min || currentTemp > max;

  let tempRisk = 0;
  if (outOfRange) tempRisk += 45;
  if (Math.abs(trendDelta) >= 4) tempRisk += 20;
  if (Number(batch.temperature_breaches || 0) > 0) tempRisk += Math.min(20, Number(batch.temperature_breaches || 0) * 5);

  const stage = String(batch.current_stage);
  const expected = stageExpectedHours[stage] || 12;
  const latestStageTime = latestStageResult.rows[0]?.timestamp ? new Date(latestStageResult.rows[0].timestamp) : new Date(batch.updated_at);
  const hoursSinceProgress = (Date.now() - latestStageTime.getTime()) / (1000 * 60 * 60);

  let delayRisk = 0;
  if (hoursSinceProgress > expected) {
    const overrunPct = ((hoursSinceProgress - expected) / expected) * 100;
    delayRisk = Math.min(30, Math.round(overrunPct / 5));
  }

  const unresolvedAlerts = Number(unresolvedAlertsResult.rows[0]?.count || 0);
  const alertRisk = Math.min(20, unresolvedAlerts * 5);

  const recalledRisk = batch.is_recalled ? 30 : 0;

  const riskScore = Math.min(100, tempRisk + delayRisk + alertRisk + recalledRisk);
  const estimatedFailure = Math.min(98, Math.max(5, Math.round(riskScore + (outOfRange ? 8 : 0))));

  return {
    batchId: batch.batch_id,
    medicineName: batch.medicine_name,
    currentStage: batch.current_stage,
    currentTemperature: currentTemp,
    targetRange: { min, max },
    trendDelta: Number(trendDelta.toFixed(2)),
    delayHours: Number(hoursSinceProgress.toFixed(2)),
    unresolvedAlerts,
    riskPrediction: scoreToBand(riskScore),
    estimatedFailure,
    reason: {
      tempTrend: tempRisk,
      routeDelay: delayRisk,
      activeAlerts: alertRisk,
      recalled: recalledRisk
    }
  };
};

export const getRiskPredictions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const batchIdsResult = await query('SELECT batch_id FROM batches ORDER BY created_at DESC');
    const predictions = await Promise.all(batchIdsResult.rows.map((r: any) => buildPrediction(r.batch_id)));

    res.json({
      success: true,
      count: predictions.filter(Boolean).length,
      data: predictions.filter(Boolean)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to compute risk predictions' });
  }
};

export const getBatchRiskPrediction = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = String(req.params.batchId || '').toUpperCase();
    const prediction = await buildPrediction(batchId);

    if (!prediction) {
      res.status(404).json({ success: false, error: 'Batch not found' });
      return;
    }

    res.json({ success: true, data: prediction });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to compute batch risk prediction' });
  }
};
