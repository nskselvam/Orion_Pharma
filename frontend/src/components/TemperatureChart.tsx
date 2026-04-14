import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import type { TemperatureDataPoint } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  minTemp?: number;
  maxTemp?: number;
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ 
  data, 
  minTemp = 2, 
  maxTemp = 8 
}) => {
  // Format timestamps for display
  const labels = data.map(d => {
    const date = new Date(d.timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  });

  // Extract temperature values
  const temperatures = data.map(d => d.temperature);

  // Identify breaches
  const breachPoints = data.map(d => d.breach ? d.temperature : null);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatures,
        borderColor: 'rgb(0, 113, 227)',
        backgroundColor: 'rgba(0, 113, 227, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(0, 113, 227)',
      },
      {
        label: 'Breach Points',
        data: breachPoints,
        borderColor: 'rgb(255, 59, 48)',
        backgroundColor: 'rgb(255, 59, 48)',
        borderWidth: 0,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle',
        showLine: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            size: 13,
          },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          weight: 600,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) return '';
            const isBreach = value < minTemp || value > maxTemp;
            return `${context.dataset.label}: ${value}°C${isBreach ? ' ⚠️ BREACH' : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#86868b',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#86868b',
          callback: (value) => `${value}°C`,
        },
        min: Math.min(minTemp - 2, ...temperatures) - 1,
        max: Math.max(maxTemp + 2, ...temperatures) + 1,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const breachCount = data.filter(d => d.breach).length;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Temperature Monitoring</h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Range: {minTemp}°C - {maxTemp}°C
          </div>
          {breachCount > 0 && (
            <span className="badge badge-danger">
              {breachCount} Breach{breachCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TemperatureChart;
