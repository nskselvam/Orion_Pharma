import { Request, Response } from 'express';

/**
 * Location Controller
 * Handles location search through Nominatim (OpenStreetMap)
 */

const DEFAULT_LIMIT = 8;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    state?: string;
    region?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

interface LocationResult {
  id: number;
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  state: string | null;
  city: string | null;
  display: string;
}

const mapNominatimRecord = (item: NominatimResult): LocationResult => ({
  id: item.place_id,
  name: item.display_name,
  lat: Number(item.lat),
  lng: Number(item.lon),
  country: item.address?.country || null,
  state: item.address?.state || item.address?.region || null,
  city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || null,
  display: item.display_name
});

const fetchPlaces = async (query: string, limit: number = DEFAULT_LIMIT): Promise<LocationResult[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit)
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PharmaChain-Inventory-Demo/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Location lookup failed with status ${response.status}`);
  }

  const data = await response.json() as NominatimResult[];
  return data.map(mapNominatimRecord);
};

/**
 * Search locations
 * GET /api/pharma/location/search
 */
export const searchLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryStr = String(req.query.query || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT, 12);

    if (!queryStr || queryStr.length < 2) {
      res.json({
        success: true,
        data: []
      });
      return;
    }

    const data = await fetchPlaces(queryStr, limit);

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error: any) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search locations'
    });
  }
};
