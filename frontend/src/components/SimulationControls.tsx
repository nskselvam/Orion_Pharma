import React from 'react';
import {
  useSimulateTemperatureMutation,
  useSimulateLocationMutation,
  useGetBatchDetailsQuery,
} from '../redux-slice/pharmaApiSlice';

interface SimulationControlsProps {
  batchId: string;
  onSimulationComplete?: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  batchId,
  onSimulationComplete,
}) => {
  const [simulateTemperature, { isLoading: tempLoading }] = useSimulateTemperatureMutation();
  const [simulateLocation, { isLoading: locationLoading }] = useSimulateLocationMutation();
  const { data: batchResponse } = useGetBatchDetailsQuery(batchId);
  
  // Get current stage
  const currentStage = (batchResponse as any)?.data?.currentStage;
  const isAtFinalDestination = currentStage === 'pharmacy';

  const handleTemperatureSimulation = async (type: 'breach' | 'warning' | 'critical') => {
    try {
      // Map types to temperature values
      const tempMap = {
        breach: 10, // Minor breach
        warning: 13, // Warning level
        critical: 20, // Critical breach
      };
      
      await simulateTemperature({ 
        batchId, 
        value: tempMap[type]
      }).unwrap();
      
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    } catch (error) {
      console.error('Temperature simulation failed:', error);
      alert('Failed to simulate temperature. Please try again.');
    }
  };

  const handleLocationChange = async () => {
    try {
      await simulateLocation({ batchId }).unwrap();
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    } catch (error: any) {
      console.error('Location simulation failed:', error);
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to simulate location change. Please try again.';
      alert(errorMessage);
    }
  };

  const isLoading = tempLoading || locationLoading;

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px' }}>Simulation Controls</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Test cold chain scenarios by simulating temperature variations and location changes
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Temperature Simulations */}
        <div>
          <h4 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600' }}>
            Temperature Events
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <button
              onClick={() => handleTemperatureSimulation('breach')}
              disabled={isLoading}
              className="simulation-btn"
              title="Simulate a minor temperature deviation"
            >
              <span>🌡️</span>
              <span>Minor Breach (±2°C)</span>
            </button>

            <button
              onClick={() => handleTemperatureSimulation('warning')}
              disabled={isLoading}
              className="simulation-btn simulation-btn-warning"
              title="Simulate a moderate temperature warning"
            >
              <span>⚠️</span>
              <span>Warning Event (±5°C)</span>
            </button>

            <button
              onClick={() => handleTemperatureSimulation('critical')}
              disabled={isLoading}
              className="simulation-btn simulation-btn-critical"
              title="Simulate a critical temperature failure"
            >
              <span>🚨</span>
              <span>Critical Failure (±10°C)</span>
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Location Simulation */}
        <div>
          <h4 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600' }}>
            Journey Progress
          </h4>
          {isAtFinalDestination ? (
            <div
              style={{
                padding: '14px',
                background: 'rgba(52, 199, 89, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(52, 199, 89, 0.3)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>✅</span>
              <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '500' }}>
                Batch Delivered
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                This batch has reached its final destination
              </p>
            </div>
          ) : (
            <button
              onClick={handleLocationChange}
              disabled={isLoading}
              className="simulation-btn"
              style={{ width: '100%' }}
              title="Move batch to next location"
            >
              <span>📍</span>
              <span>Advance to Next Location</span>
            </button>
          )}
        </div>

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'var(--background-secondary)',
              borderRadius: '10px',
              marginTop: '8px',
            }}
          >
            <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Running simulation...
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(0, 113, 227, 0.08)',
          borderRadius: '10px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}
      >
        <strong style={{ color: 'var(--accent)' }}>💡 Note:</strong> These simulations update the
        batch data in real-time. Trust scores and alerts will be automatically recalculated.
      </div>
    </div>
  );
};

export default SimulationControls;
