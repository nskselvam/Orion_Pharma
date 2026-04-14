import { Router } from 'express';
import {
  getAllAlerts,
  getBatchAlerts,
  getActiveAlerts,
  resolveAlert,
  createAlert
} from '../controllers/alertController';

const router = Router();

/**
 * Alert Routes
 * Base path: /api/pharma/alerts
 */

// Get all alerts
router.get('/', getAllAlerts);

// Get active alerts
router.get('/active', getActiveAlerts);

// Get alerts for specific batch
router.get('/batch/:batchId', getBatchAlerts);

// Resolve an alert
router.patch('/:id/resolve', resolveAlert);

// Create alert manually
router.post('/', createAlert);

export default router;
