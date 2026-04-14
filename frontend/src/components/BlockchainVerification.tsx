import React, { useState } from 'react';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useHashVerification, useBlockchainStatus, useWalletConnection } from '../hooks/useBlockchain';

interface BlockchainVerificationProps {
  hash?: string;
  data?: any;
  className?: string;
}

const BlockchainVerification: React.FC<BlockchainVerificationProps> = ({ 
  hash: initialHash, 
  data,
  className = '' 
}) => {
  const [hash, setHash] = useState(initialHash || '');
  const { verifyHash, verifyData, loading: verifying } = useHashVerification();
  const { status, loading: statusLoading } = useBlockchainStatus();
  const { wallet, connectWallet, isConnected, loading: walletLoading } = useWalletConnection();
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleVerifyHash = async () => {
    if (!hash) return;
    
    const result = await verifyHash(hash);
    setVerificationResult(result);
    setShowDetails(true);
  };

  const handleVerifyData = async () => {
    if (!data || !hash) return;
    
    const result = await verifyData(data, hash);
    setVerificationResult(result);
    setShowDetails(true);
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  if (statusLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body text-center">
          <FaSpinner className="fa-spin" size={24} />
          <p className="mt-2">Checking blockchain status...</p>
        </div>
      </div>
    );
  }

  if (!status?.enabled) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body">
          <div className="alert alert-info">
            <FaShieldAlt className="me-2" />
            Blockchain verification is currently disabled
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header bg-primary text-white">
        <FaShieldAlt className="me-2" />
        Blockchain Verification
      </div>
      <div className="card-body">
        {/* Blockchain Status */}
        <div className="mb-3">
          <h6>Blockchain Status</h6>
          <div className="d-flex align-items-center gap-2">
            {status?.connected ? (
              <>
                <FaCheckCircle className="text-success" />
                <span className="text-success">Connected</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-danger" />
                <span className="text-danger">Not Connected</span>
              </>
            )}
          </div>
          {status?.connected && (
            <div className="mt-2 small text-muted">
              <div>Contract: {status.contractAddress?.substring(0, 10)}...{status.contractAddress?.substring(status.contractAddress.length - 8)}</div>
              <div>Hashes Stored: {status.hashCount}</div>
              <div>Block Number: {status.blockNumber}</div>
            </div>
          )}
        </div>

        {/* Wallet Connection */}
        <div className="mb-3">
          <h6>Wallet Connection</h6>
          {!isConnected ? (
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleConnectWallet}
              disabled={walletLoading}
            >
              {walletLoading ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Connecting...
                </>
              ) : (
                'Connect MetaMask'
              )}
            </button>
          ) : (
            <div className="alert alert-success py-2">
              <FaCheckCircle className="me-2" />
              Connected: {wallet?.address?.substring(0, 10)}...{wallet?.address?.substring(wallet.address.length - 8)}
              <div className="small">Balance: {wallet?.balance} ETH</div>
            </div>
          )}
        </div>

        <hr />

        {/* Hash Verification */}
        <div className="mb-3">
          <label className="form-label">
            <strong>Verify Hash</strong>
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter hash to verify..."
              value={hash}
              onChange={(e) => setHash(e.target.value)}
            />
            <button 
              className="btn btn-primary"
              onClick={handleVerifyHash}
              disabled={verifying || !hash || !status?.connected}
            >
              {verifying ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
          <small className="text-muted">
            Enter a hash to check if it exists on the blockchain
          </small>
        </div>

        {/* Data Verification */}
        {data && (
          <div className="mb-3">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleVerifyData}
              disabled={verifying || !hash || !status?.connected}
            >
              Verify Data Match
            </button>
            <small className="text-muted d-block mt-1">
              Check if the provided data matches the hash
            </small>
          </div>
        )}

        {/* Verification Results */}
        {showDetails && verificationResult && (
          <div className={`alert ${
            verificationResult.exists || verificationResult.matches 
              ? 'alert-success' 
              : 'alert-warning'
          } mt-3`}>
            <div className="d-flex align-items-center">
              {verificationResult.exists || verificationResult.matches ? (
                <>
                  <FaCheckCircle size={24} className="me-2" />
                  <div>
                    <strong>
                      {verificationResult.matches !== undefined 
                        ? 'Data Verified' 
                        : 'Hash Found'}
                    </strong>
                    {verificationResult.timestamp && (
                      <div className="small">
                        Stored: {new Date(verificationResult.timestamp).toLocaleString()}
                      </div>
                    )}
                    {verificationResult.matches !== undefined && (
                      <div className="small">
                        Computed: {verificationResult.computedHash?.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <FaTimesCircle size={24} className="me-2" />
                  <div>
                    <strong>
                      {verificationResult.matches !== undefined 
                        ? 'Data Does Not Match' 
                        : 'Hash Not Found'}
                    </strong>
                    <div className="small">
                      {verificationResult.onChain 
                        ? 'Hash is not stored on blockchain'
                        : 'Blockchain connection unavailable'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainVerification;
