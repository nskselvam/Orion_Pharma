export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  duration: number;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate travel duration based on distance
 * Assumes highway speed of ~80 km/h average
 * @param distance Distance in kilometers
 * @returns Duration in hours
 */
export function estimateDuration(distance: number): number {
  const avgSpeed = 80; // km/h
  const duration = distance / avgSpeed;
  return Math.round(duration * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate route legs between multiple waypoints
 * @param waypoints Array of coordinates
 * @returns Array of route legs
 */
export function calculateRoutLegs(waypoints: Coordinates[]): RouteLeg[] {
  if (waypoints.length < 2) return [];

  const legs: RouteLeg[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const distance = calculateDistance(from, to);
    const duration = estimateDuration(distance);

    legs.push({ from, to, distance, duration });
  }

  return legs;
}

/**
 * Calculate the total distance for a route
 * @param waypoints Array of coordinates
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(waypoints: Coordinates[]): number {
  const legs = calculateRoutLegs(waypoints);
  return legs.reduce((total, leg) => total + leg.distance, 0);
}

/**
 * Calculate the total duration for a route
 * @param waypoints Array of coordinates
 * @returns Total duration in hours
 */
export function calculateTotalDuration(waypoints: Coordinates[]): number {
  const legs = calculateRoutLegs(waypoints);
  return legs.reduce((total, leg) => total + leg.duration, 0);
}

/**
 * Get the center point (centroid) of multiple coordinates
 * @param coordinates Array of coordinates
 * @returns Center coordinates
 */
export function getCenterPoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Format duration for display
 * @param duration Duration in hours
 * @returns Formatted string
 */
export function formatDuration(duration: number): string {
  if (duration < 1) {
    return `${Math.round(duration * 60)} min`;
  }
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
