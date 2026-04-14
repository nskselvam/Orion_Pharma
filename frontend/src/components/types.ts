// Component prop types

export interface Alert {
  id?: number;
  batchId: string;
  medicineName?: string;
  currentStage?: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: any;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface BatchStage {
  stage: string;
  location: string;
  timestamp: string;
  temperature: number;
  status: 'completed' | 'current' | 'pending';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Batch {
  batchId: string;
  medicineName: string;
  origin: string;
  destination: string;
  originCoordinates?: {
    lat: string | number;
    lng: string | number;
  };
  destinationCoordinates?: {
    lat: string | number;
    lng: string | number;
  };
  quantityInStock?: number;
  currentStage: 'manufacturer' | 'warehouse' | 'distributor' | 'pharmacy';
  temperature: number;
  targetTempMin: number;
  targetTempMax: number;
  temperatureBreaches?: number;
  trustScore: number;
  status: 'in-transit' | 'delivered' | 'compromised';
  blockchainHash?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: BatchStage[];
  alerts?: Alert[];
}

export interface TemperatureDataPoint {
  timestamp: string;
  temperature: number;
  breach?: boolean;
}

export interface LocationOption {
  id: number;
  name: string;
  display: string;
  lat: number;
  lng: number;
  country: string | null;
  state: string | null;
  city: string | null;
}
