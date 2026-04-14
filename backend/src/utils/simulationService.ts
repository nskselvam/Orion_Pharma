import { Coordinates, BatchStage } from '../types/pharma.types';

/**
 * Simulation Service
 * Handles IoT simulation for temperature and location tracking
 */

// Store active simulations
const activeSimulations = new Map<string, NodeJS.Timeout>();

// Define stage coordinates for simulation
export const STAGE_COORDINATES = {
  manufacturer: {
    name: 'Pfizer Manufacturing',
    lat: 19.0760,
    lng: 72.8777
  },
  warehouse: {
    name: 'Central Warehouse',
    lat: 21.1458,
    lng: 79.0882
  },
  distributor: {
    name: 'Regional Distributor',
    lat: 26.8467,
    lng: 80.9462
  },
  pharmacy: {
    name: 'City Pharmacy',
    lat: 28.7041,
    lng: 77.1025
  }
};

/**
 * Get coordinates for a stage
 */
export const getStageCoordinates = (stage: BatchStage): Coordinates => {
  const stageInfo = STAGE_COORDINATES[stage];
  return {
    lat: stageInfo.lat,
    lng: stageInfo.lng
  };
};

/**
 * Start simulation for a batch
 */
export const startSimulation = (batchId: string): void => {
  // Stop existing simulation if any
  stopSimulation(batchId);

  console.log(`🔄 Starting simulation for batch ${batchId}`);

  // For now, just log that simulation started
  // In a full implementation, this would:
  // 1. Periodically update temperature
  // 2. Update location based on stage
  // 3. Calculate trust score changes
  // 4. Generate alerts for breaches

  // Example: simulate every 30 seconds
  // const interval = setInterval(async () => {
  //   // Update temperature, location, etc.
  // }, 30000);

  // activeSimulations.set(batchId, interval);
};

/**
 * Stop simulation for a batch
 */
export const stopSimulation = (batchId: string): void => {
  const simulation = activeSimulations.get(batchId);
  if (simulation) {
    clearInterval(simulation);
    activeSimulations.delete(batchId);
    console.log(`⏹️  Stopped simulation for batch ${batchId}`);
  }
};

/**
 * Stop all simulations
 */
export const stopAllSimulations = (): void => {
  activeSimulations.forEach((interval, batchId) => {
    clearInterval(interval);
    console.log(`⏹️  Stopped simulation for batch ${batchId}`);
  });
  activeSimulations.clear();
};

/**
 * Check if simulation is active for a batch
 */
export const isSimulationActive = (batchId: string): boolean => {
  return activeSimulations.has(batchId);
};

/**
 * Get active simulation count
 */
export const getActiveSimulationCount = (): number => {
  return activeSimulations.size;
};
