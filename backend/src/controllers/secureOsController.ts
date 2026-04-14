import { Request, Response } from 'express';
import { query } from '../config/database';
import { getBlockchainProof } from '../utils/blockchainService';
import { runRustSecureVerifier } from '../utils/rustSecureVerifier';

export const secureVerifyBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = String(req.params.batchId || '').toUpperCase();
    if (!batchId) {
      res.status(400).json({ success: false, error: 'batchId is required' });
      return;
    }

    const batchResult = await query('SELECT * FROM batches WHERE batch_id = $1', [batchId]);
    if (batchResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Batch not found' });
      return;
    }

    const batch = batchResult.rows[0];
    const proof = batch.blockchain_hash ? await getBlockchainProof(batch.blockchain_hash) : null;

    const alertsResult = await query(
      'SELECT COUNT(*)::int AS count FROM alerts WHERE batch_id = $1 AND resolved = false',
      [batchId]
    );
    const activeAlerts = Number(alertsResult.rows[0]?.count || 0);

    const currentTemp = Number(batch.temperature);
    const minTemp = Number(batch.target_temp_min);
    const maxTemp = Number(batch.target_temp_max);
    const outOfRange = currentTemp < minTemp || currentTemp > maxTemp;
    const estimatedFailure = Math.min(
      98,
      Math.max(
        5,
        (batch.is_recalled ? 40 : 0) +
          (batch.status === 'compromised' ? 25 : 0) +
          (outOfRange ? 22 : 0) +
          Math.min(11, activeAlerts * 2)
      )
    );

    const rustDecision = await runRustSecureVerifier({
      batchId,
      hasBlockchainHash: !!batch.blockchain_hash,
      onChainVerified: !!proof?.exists,
      notCompromised: batch.status !== 'compromised',
      notRecalled: !batch.is_recalled,
      temperature: currentTemp,
      targetTempMin: minTemp,
      targetTempMax: maxTemp,
      estimatedFailure,
      activeAlerts
    });

    res.json({
      success: true,
      data: {
        batchId: batch.batch_id,
        allowed: rustDecision.allowed,
        mode: rustDecision.mode,
        reason: rustDecision.reason,
        checks: rustDecision.checks,
        security: {
          engine: 'rust',
          policyVersion: rustDecision.policyVersion,
          securityScore: rustDecision.securityScore,
          estimatedFailure,
          activeAlerts
        },
        proof: proof
          ? {
              hash: proof.hash,
              transactionHash: proof.transactionHash,
              timestamp: proof.timestamp,
              events: proof.events
            }
          : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Secure OS verification failed' });
  }
};
