/**
 * Route Generator for Supply Chain
 * Generates realistic routes between Indian cities
 */

export interface RouteStage {
  name: string;
  location: string;
  lat: number;
  lng: number;
  temperature?: number;
}

// City coordinates mapping
const CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Delhi': { lat: 28.7041, lng: 77.0513 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Goa': { lat: 15.8700, lng: 73.8477 },
};

// Define routes between major cities
const ROUTES: Record<string, Record<string, string[]>> = {
  'Chennai': {
    'Mumbai': ['Chennai', 'Hyderabad', 'Pune', 'Mumbai'],
    'Delhi': ['Chennai', 'Hyderabad', 'Jaipur', 'Delhi'],
    'Bangalore': ['Chennai', 'Bangalore'],
    'Kolkata': ['Chennai', 'Hyderabad', 'Kolkata'],
  },
  'Mumbai': {
    'Chennai': ['Mumbai', 'Pune', 'Hyderabad', 'Chennai'],
    'Delhi': ['Mumbai', 'Jaipur', 'Delhi'],
    'Bangalore': ['Mumbai', 'Bangalore'],
    'Ahmedabad': ['Mumbai', 'Ahmedabad'],
  },
  'Delhi': {
    'Mumbai': ['Delhi', 'Jaipur', 'Mumbai'],
    'Chennai': ['Delhi', 'Jaipur', 'Hyderabad', 'Chennai'],
    'Lucknow': ['Delhi', 'Lucknow'],
  },
  'Bangalore': {
    'Chennai': ['Bangalore', 'Chennai'],
    'Mumbai': ['Bangalore', 'Mumbai'],
    'Hyderabad': ['Bangalore', 'Hyderabad'],
  },
  'Hyderabad': {
    'Chennai': ['Hyderabad', 'Chennai'],
    'Mumbai': ['Hyderabad', 'Pune', 'Mumbai'],
    'Delhi': ['Hyderabad', 'Jaipur', 'Delhi'],
  },
  'Pune': {
    'Mumbai': ['Pune', 'Mumbai'],
    'Delhi': ['Pune', 'Jaipur', 'Delhi'],
  },
};

/**
 * Extract city name from location text
 */
function extractCityName(locationText: string): string {
  const text = locationText.trim();
  
  // Check for exact city matches
  for (const city of Object.keys(CITIES)) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  
  // Try to extract from "City, State" format
  const parts = text.split(',');
  if (parts.length > 0) {
    const firstPart = parts[0].trim();
    for (const city of Object.keys(CITIES)) {
      if (firstPart.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
  }
  
  return text;
}

/**
 * Generate route stages from origin to destination
 */
export function generateRouteStages(
  origin: string,
  destination: string,
  temperature: number = 22
): RouteStage[] {
  const originCity = extractCityName(origin);
  const destCity = extractCityName(destination);

  // Get route waypoints
  let waypoints = ROUTES[originCity]?.[destCity];

  if (!waypoints) {
    // Fallback: simple route with origin and destination
    waypoints = [originCity, destCity];
  }

  // Map waypoints to stages
  const stages: RouteStage[] = [];
  const stageNames = [
    'Pfizer Manufacturing',
    'Central Warehouse',
    'Regional Distributor',
    'City Pharmacy',
  ];

  waypoints.forEach((city, index) => {
    const coords = CITIES[city as keyof typeof CITIES] || { lat: 20.5937, lng: 79.0505 };
    const stageName = stageNames[Math.min(index, stageNames.length - 1)];
    
    // Add slight temperature variation
    const tempVariation = Math.random() * 2 - 1; // -1 to +1
    
    stages.push({
      name: stageName,
      location: city,
      lat: coords.lat,
      lng: coords.lng,
      temperature: parseFloat((temperature + tempVariation).toFixed(1)),
    });
  });

  return stages;
}

/**
 * Get stage type based on index
 */
export function getStageType(index: number, total: number): string {
  if (index === 0) return 'manufacturer';
  if (index === total - 1) return 'pharmacy';
  if (index < total - 1) return 'warehouse';
  return 'distributor';
}

export default { generateRouteStages, getStageType };
