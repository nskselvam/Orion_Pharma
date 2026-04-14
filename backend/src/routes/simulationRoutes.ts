import { Router } from 'express';
import {
  simulateTemperature,
  simulateLocation,
  getSimulationStatus
} from '../controllers/simulationController';

const router = Router();

/**
 * Simulation Routes
 * Base path: /api/pharma/simulate
 */

// Simulate temperature change
router.post('/temperature', simulateTemperature);

// Simulate location/stage change
router.post('/location', simulateLocation);

// Get simulation status
router.get('/status', getSimulationStatus);

export default router;
