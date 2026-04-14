import { apiSlice } from './apiSlice';

/**
 * Pharmaceutical Supply Chain API Slice
 * RTK Query endpoints for batch, alert, location, and simulation management
 */

// Types
export interface Coordinates {
  lat: number;
  lng: number;
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

export interface Batch {
  batchId: string;
  medicineName: string;
  origin: string;
  destination: string;
  originCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  quantityInStock?: number;
  currentStage: 'manufacturer' | 'warehouse' | 'distributor' | 'pharmacy';
  temperature: number;
  targetTempMin: number;
  targetTempMax: number;
  trustScore: number;
  status: 'in-transit' | 'delivered' | 'compromised' | 'recalled';
  blockchainHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: number;
  batchId: string;
  type: 'temperature_breach' | 'predicted_breach' | 'delay' | 'route_deviation' | 'trust_critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface SimulateTemperatureRequest {
  batchId: string;
  breach?: boolean;
  spike?: boolean;
  value?: number;
}

export interface SimulateLocationRequest {
  batchId: string;
}

export interface BlockchainProof {
  batchId: string;
  available: boolean;
  onChain?: boolean;
  exists?: boolean;
  hash?: string;
  timestamp?: string;
  transactionHash?: string;
  blockNumber?: number;
  events?: Array<{
    event: string;
    transactionHash: string;
    blockNumber: number;
    timestamp?: string;
    storedBy?: string;
  }>;
  message?: string;
}

export interface RiskPrediction {
  batchId: string;
  medicineName: string;
  currentStage: string;
  currentTemperature: number;
  targetRange: { min: number; max: number };
  trendDelta: number;
  delayHours: number;
  unresolvedAlerts: number;
  riskPrediction: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedFailure: number;
  reason: {
    tempTrend: number;
    routeDelay: number;
    activeAlerts: number;
    recalled: number;
  };
}

export interface SecureOsVerification {
  batchId: string;
  allowed: boolean;
  mode: 'SECURE_ALLOW' | 'SECURE_DENY';
  reason: string;
  checks: {
    hasBlockchainHash: boolean;
    onChainVerified: boolean;
    notCompromised: boolean;
    notRecalled: boolean;
    temperatureInRange: boolean;
  };
  proof: null | {
    hash: string;
    transactionHash?: string;
    timestamp?: string;
    events: Array<{
      event: string;
      transactionHash: string;
      blockNumber: number;
      timestamp?: string;
      storedBy?: string;
    }>;
  };
  security?: {
    engine: 'rust';
    policyVersion: string;
    securityScore: number;
    estimatedFailure: number;
    activeAlerts: number;
  };
}

export const pharmaApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Batch Management
    getAllBatches: builder.query<{ success: boolean; count: number; data: Batch[] }, void>({
      query: () => '/pharma/batch',
      providesTags: ['Batches']
    }),

    getBatchDetails: builder.query<{ success: boolean; data: any }, string>({
      query: (batchId) => `/pharma/batch/${batchId}`,
      providesTags: (_result, _error, batchId) => [{ type: 'Batches', id: batchId }]
    }),

    createBatch: builder.mutation<{ success: boolean; data: Batch }, CreateBatchRequest>({
      query: (data) => ({
        url: '/pharma/batch/create',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Batches']
    }),

    deleteBatch: builder.mutation<{ success: boolean; message: string }, string>({
      query: (batchId) => ({
        url: `/pharma/batch/${batchId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Batches', 'Alerts']
    }),

    recallBatch: builder.mutation<{ success: boolean; message: string; data: any }, { batchId: string; recalledBy?: string }>({
      query: ({ batchId, recalledBy }) => ({
        url: `/pharma/batch/${batchId}/recall`,
        method: 'POST',
        body: { recalledBy: recalledBy || 'admin' }
      }),
      invalidatesTags: ['Batches', 'Alerts']
    }),

    // Alert Management
    getAllAlerts: builder.query<{ success: boolean; count: number; data: Alert[] }, { resolved?: boolean; limit?: number }>({
      query: (params) => ({
        url: '/pharma/alerts',
        params
      }),
      providesTags: ['Alerts']
    }),

    getActiveAlerts: builder.query<{ success: boolean; count: number; severityCount: any; data: Alert[] }, void>({
      query: () => '/pharma/alerts/active',
      providesTags: ['Alerts']
    }),

    getBatchAlerts: builder.query<{ success: boolean; count: number; data: Alert[] }, { batchId: string; resolved?: boolean; limit?: number }>({
      query: ({ batchId, ...params }) => ({
        url: `/pharma/alerts/batch/${batchId}`,
        params
      }),
      providesTags: (_result, _error, { batchId }) => [{ type: 'Alerts', id: batchId }]
    }),

    resolveAlert: builder.mutation<{ success: boolean; message: string; data: Alert }, number>({
      query: (alertId) => ({
        url: `/pharma/alerts/${alertId}/resolve`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Alerts']
    }),

    createAlert: builder.mutation<{ success: boolean; data: Alert }, Partial<Alert>>({
      query: (data) => ({
        url: '/pharma/alerts',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Alerts']
    }),

    // Location Services
    searchLocations: builder.query<{ success: boolean; count: number; data: any[] }, { query: string; limit?: number }>({
      query: (params) => ({
        url: '/pharma/location/search',
        params
      })
    }),

    // Simulation
    simulateTemperature: builder.mutation<{ success: boolean; message: string; data: any }, SimulateTemperatureRequest>({
      query: (data) => ({
        url: '/pharma/simulate/temperature',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Batches', 'Alerts']
    }),

    simulateLocation: builder.mutation<{ success: boolean; message: string; data: any }, SimulateLocationRequest>({
      query: (data) => ({
        url: '/pharma/simulate/location',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Batches']
    }),

    getSimulationStatus: builder.query<{ success: boolean; data: any }, string>({
      query: (batchId) => `/pharma/simulate/status?batchId=${batchId}`,
      providesTags: (_result, _error, batchId) => [{ type: 'Batches', id: batchId }]
    }),

    // Verification
    verifyBatch: builder.query<{ success: boolean; data: any }, string>({
      query: (batchId) => `/pharma/verify/${batchId}`
    }),

    getBlockchainProof: builder.query<{ success: boolean; data: BlockchainProof }, string>({
      query: (batchId) => `/blockchain/proof-batch/${batchId}`
    }),

    getRiskPredictions: builder.query<{ success: boolean; count: number; data: RiskPrediction[] }, void>({
      query: () => '/pharma/risk/predictions',
      providesTags: ['Batches', 'Alerts']
    }),

    getBatchRiskPrediction: builder.query<{ success: boolean; data: RiskPrediction }, string>({
      query: (batchId) => `/pharma/risk/predictions/${batchId}`,
      providesTags: (_r, _e, batchId) => [{ type: 'Batches', id: batchId }]
    }),

    getSecureOsVerification: builder.query<{ success: boolean; data: SecureOsVerification }, string>({
      query: (batchId) => `/pharma/secure-os/verify/${batchId}`
    })
  })
});

// Export hooks for usage in functional components
export const {
  useGetAllBatchesQuery,
  useGetBatchDetailsQuery,
  useCreateBatchMutation,
  useDeleteBatchMutation,
  useRecallBatchMutation,
  useGetAllAlertsQuery,
  useGetActiveAlertsQuery,
  useGetBatchAlertsQuery,
  useResolveAlertMutation,
  useCreateAlertMutation,
  useSearchLocationsQuery,
  useSimulateTemperatureMutation,
  useSimulateLocationMutation,
  useGetSimulationStatusQuery,
  useVerifyBatchQuery,
  useGetBlockchainProofQuery,
  useGetRiskPredictionsQuery,
  useGetBatchRiskPredictionQuery,
  useLazyGetSecureOsVerificationQuery
} = pharmaApiSlice;
