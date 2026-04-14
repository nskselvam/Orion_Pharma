// Type definitions for Pharmaceutical Supply Chain System

export type BatchStage = 'manufacturer' | 'warehouse' | 'distributor' | 'pharmacy';
export type BatchStatus = 'in-transit' | 'delivered' | 'compromised';
export type AlertType = 'temperature_breach' | 'predicted_breach' | 'delay' | 'route_deviation' | 'trust_critical';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LogType = 'temperature' | 'location' | 'trust_score' | 'alert';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StageInfo {
  id?: number;
  batch_id: string;
  name: string;
  location: string;
  timestamp: Date;
  temperature?: number;
  coordinates_lat?: number;
  coordinates_lng?: number;
}

export interface Batch {
  id?: number;
  batch_id: string;
  medicine_name: string;
  origin: string;
  origin_lat?: number;
  origin_lng?: number;
  destination: string;
  destination_lat?: number;
  destination_lng?: number;
  quantity_in_stock?: number;
  current_stage: BatchStage;
  temperature: number;
  target_temp_min: number;
  target_temp_max: number;
  trust_score: number;
  status: BatchStatus;
  blockchain_hash?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BatchWithStages extends Batch {
  stages?: StageInfo[];
}

export interface Alert {
  id?: number;
  batch_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: any;
  resolved: boolean;
  resolved_at?: Date;
  created_at?: Date;
}

export interface Log {
  id?: number;
  batch_id: string;
  type: LogType;
  value: any;
  previous_value?: any;
  blockchain_hash?: string;
  timestamp?: Date;
}

export interface CreateBatchRequest {
  batchId: string;
  medicineName: string;
  origin: string;
  destination: string;
  originCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  quantityInStock?: number;
  temperature?: number;
  targetTempMin?: number;
  targetTempMax?: number;
}

export interface UpdateBatchRequest {
  temperature?: number;
  currentStage?: BatchStage;
  trustScore?: number;
  status?: BatchStatus;
  quantityInStock?: number;
}

export interface CreateAlertRequest {
  batchId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: any;
}

export interface SimulationUpdate {
  temperature: number;
  location: Coordinates;
  stage: BatchStage;
  trustScoreChange?: number;
}

export interface TrustScoreEvent {
  type: 'breach' | 'predicted_breach' | 'delay' | 'route_deviation' | 'stability' | 'recovery';
  impact: number;
  reason: string;
}
