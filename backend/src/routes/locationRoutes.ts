import { Router } from 'express';
import { searchLocations } from '../controllers/locationController';

const router = Router();

/**
 * Location Routes
 * Base path: /api/pharma/location
 */

// Search locations using Nominatim
router.get('/search', searchLocations);

export default router;
