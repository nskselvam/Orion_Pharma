import { useState, useEffect, useCallback } from 'react';
import blockchainService from '../utils/blockchainService';
import type { 
  BlockchainStatus, 
  HashVerification, 
  WalletConnection 
} from '../utils/blockchainService';

/**
 * Hook for blockchain status
 */
export const useBlockchainStatus = () => {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.getStatus();
      setStatus(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};

/**
 * Hook for hash verification
 */
export const useHashVerification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyHash = useCallback(async (hash: string): Promise<HashVerification | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.verifyHash(hash);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyData = useCallback(async (data: any, hash: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.verifyData(data, hash);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { verifyHash, verifyData, loading, error };
};

/**
 * Hook for wallet connection
 */
export const useWalletConnection = () => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.connectWallet();
      setWallet(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const isConnected = wallet?.connected || false;

  return { 
    wallet, 
    connectWallet, 
    isConnected, 
    loading, 
    error 
  };
};

/**
 * Hook for blockchain operations
 */
export const useBlockchain = () => {
  const [hashes, setHashes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllHashes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.getAllHashes();
      setHashes(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const generateHash = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const hash = await blockchainService.generateHash(data);
      return hash;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const storeHash = useCallback(async (hash: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await blockchainService.storeHashOnChain(hash);
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hashes,
    getAllHashes,
    generateHash,
    storeHash,
    loading,
    error
  };
};
