import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useBlockchainStatus } from '../hooks/useBlockchain';

interface BlockchainStatusBadgeProps {
  showDetails?: boolean;
  className?: string;
}

const BlockchainStatusBadge: React.FC<BlockchainStatusBadgeProps> = ({ 
  showDetails = false,
  className = '' 
}) => {
  const { status, loading } = useBlockchainStatus();

  if (loading) {
    return (
      <span className={`badge bg-secondary ${className}`}>
        <FaSpinner className="fa-spin me-1" size={12} />
        Checking...
      </span>
    );
  }

  if (!status?.enabled) {
    return null; // Don't show badge if blockchain is disabled
  }

  if (status.connected) {
    return (
      <span className={`badge bg-success ${className}`} title="Blockchain connected">
        <FaCheckCircle className="me-1" size={12} />
        Blockchain Active
        {showDetails && status.hashCount !== undefined && (
          <span className="ms-2 small">({status.hashCount} hashes)</span>
        )}
      </span>
    );
  }

  return (
    <span className={`badge bg-warning text-dark ${className}`} title="Blockchain not connected">
      <FaTimesCircle className="me-1" size={12} />
      Blockchain Offline
    </span>
  );
};

export default BlockchainStatusBadge;
