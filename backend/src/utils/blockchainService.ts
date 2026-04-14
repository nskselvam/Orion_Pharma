import crypto from 'crypto';
import { ethers } from 'ethers';

/**
 * Blockchain Service
 * Handles interaction with LogStorage smart contract for tamper-proof logging
 */

// Smart contract ABI (only the functions we need)
const CONTRACT_ABI = [
  'function storeHash(string memory hash) public',
  'function storeMultipleHashes(string[] memory _hashes) public',
  'function verifyHash(string memory hash) public view returns (bool)',
  'function getHashTimestamp(string memory hash) public view returns (uint256)',
  'function getHashes() public view returns (string[] memory)',
  'function getHashCount() public view returns (uint256)',
  'function getInfo() public view returns (address _owner, uint256 _hashCount, uint256 _blockNumber, uint256 _timestamp)',
  'event HashStored(string indexed hash, uint256 timestamp, address indexed storedBy)'
];

// Configuration from environment variables
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED === 'true';
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

/**
 * Generate SHA256 hash from data
 */
export const generateHash = (data: any): string => {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Get blockchain provider and contract instance
 */
const getBlockchainConnection = async () => {
  if (!BLOCKCHAIN_ENABLED) {
    return null;
  }

  if (!CONTRACT_ADDRESS) {
    console.warn('⚠️  Blockchain contract address not configured');
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    let signer;
    if (PRIVATE_KEY) {
      signer = new ethers.Wallet(PRIVATE_KEY, provider);
    } else {
      // Use provider's default signer for local development
      signer = await provider.getSigner();
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    return { provider, contract, signer };
  } catch (error) {
    console.error('❌ Failed to connect to blockchain:', error);
    return null;
  }
};

/**
 * Store hash on blockchain
 */
export const storeHashOnBlockchain = async (data: any): Promise<{
  hash: string;
  timestamp: Date;
  onChain: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}> => {
  const hash = generateHash(data);
  
  // If blockchain is not enabled, fallback to local storage
  if (!BLOCKCHAIN_ENABLED) {
    return {
      hash,
      timestamp: new Date(),
      onChain: false
    };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      hash,
      timestamp: new Date(),
      onChain: false,
      error: 'Blockchain connection not available'
    };
  }

  try {
    const { contract } = connection;
    
    // Check if hash already exists
    const exists = await contract.verifyHash(hash);
    if (exists) {
      console.log('ℹ️  Hash already exists on blockchain');
      const timestamp = await contract.getHashTimestamp(hash);
      return {
        hash,
        timestamp: new Date(Number(timestamp) * 1000),
        onChain: true
      };
    }

    // Store hash on blockchain
    const tx = await contract.storeHash(hash);
    console.log(`⛓️  Storing hash on blockchain. Tx: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Hash stored on blockchain at block ${receipt.blockNumber}`);

    return {
      hash,
      timestamp: new Date(),
      onChain: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error('❌ Failed to store hash on blockchain:', error.message);
    return {
      hash,
      timestamp: new Date(),
      onChain: false,
      error: error.message
    };
  }
};

/**
 * Store multiple hashes on blockchain (batch operation)
 */
export const storeMultipleHashes = async (dataArray: any[]): Promise<{
  hashes: string[];
  onChain: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}> => {
  const hashes = dataArray.map(data => generateHash(data));

  if (!BLOCKCHAIN_ENABLED) {
    return { hashes, onChain: false };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      hashes,
      onChain: false,
      error: 'Blockchain connection not available'
    };
  }

  try {
    const { contract } = connection;
    
    const tx = await contract.storeMultipleHashes(hashes);
    console.log(`⛓️  Storing ${hashes.length} hashes on blockchain. Tx: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Hashes stored on blockchain at block ${receipt.blockNumber}`);

    return {
      hashes,
      onChain: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error('❌ Failed to store hashes on blockchain:', error.message);
    return {
      hashes,
      onChain: false,
      error: error.message
    };
  }
};

/**
 * Verify hash exists on blockchain
 */
export const verifyHashOnBlockchain = async (hash: string): Promise<{
  exists: boolean;
  timestamp?: Date;
  onChain: boolean;
  error?: string;
}> => {
  if (!BLOCKCHAIN_ENABLED) {
    return { exists: false, onChain: false };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      exists: false,
      onChain: false,
      error: 'Blockchain connection not available'
    };
  }

  try {
    const { contract } = connection;
    
    const exists = await contract.verifyHash(hash);
    
    if (exists) {
      const timestamp = await contract.getHashTimestamp(hash);
      return {
        exists: true,
        timestamp: new Date(Number(timestamp) * 1000),
        onChain: true
      };
    }

    return {
      exists: false,
      onChain: true
    };
  } catch (error: any) {
    console.error('❌ Failed to verify hash on blockchain:', error.message);
    return {
      exists: false,
      onChain: false,
      error: error.message
    };
  }
};

/**
 * Verify data matches hash
 */
export const verifyHash = (data: any, hash: string): boolean => {
  const computedHash = generateHash(data);
  return computedHash === hash;
};

/**
 * Get blockchain status and statistics
 */
export const getBlockchainStatus = async (): Promise<{
  enabled: boolean;
  connected: boolean;
  contractAddress?: string;
  hashCount?: number;
  blockNumber?: number;
  owner?: string;
  error?: string;
}> => {
  if (!BLOCKCHAIN_ENABLED) {
    return { enabled: false, connected: false };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      enabled: true,
      connected: false,
      error: 'Failed to connect to blockchain'
    };
  }

  try {
    const { contract, provider } = connection;
    
    const [owner, hashCount] = await contract.getInfo();
    const currentBlock = await provider.getBlockNumber();

    return {
      enabled: true,
      connected: true,
      contractAddress: CONTRACT_ADDRESS,
      hashCount: Number(hashCount),
      blockNumber: Number(currentBlock),
      owner
    };
  } catch (error: any) {
    return {
      enabled: true,
      connected: false,
      error: error.message
    };
  }
};

/**
 * Get all hashes from blockchain
 */
export const getAllHashes = async (): Promise<{
  hashes: string[];
  onChain: boolean;
  error?: string;
}> => {
  if (!BLOCKCHAIN_ENABLED) {
    return { hashes: [], onChain: false };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      hashes: [],
      onChain: false,
      error: 'Blockchain connection not available'
    };
  }

  try {
    const { contract } = connection;
    const hashes = await contract.getHashes();
    
    return {
      hashes,
      onChain: true
    };
  } catch (error: any) {
    console.error('❌ Failed to get hashes from blockchain:', error.message);
    return {
      hashes: [],
      onChain: false,
      error: error.message
    };
  }
};

/**
 * Get detailed blockchain proof for a hash
 */
export const getBlockchainProof = async (hash: string): Promise<{
  onChain: boolean;
  exists: boolean;
  hash: string;
  timestamp?: Date;
  transactionHash?: string;
  blockNumber?: number;
  events: Array<{
    event: string;
    transactionHash: string;
    blockNumber: number;
    timestamp?: Date;
    storedBy?: string;
  }>;
  error?: string;
}> => {
  if (!BLOCKCHAIN_ENABLED) {
    return {
      onChain: false,
      exists: false,
      hash,
      events: [],
      error: 'Blockchain is disabled'
    };
  }

  const connection = await getBlockchainConnection();
  if (!connection) {
    return {
      onChain: false,
      exists: false,
      hash,
      events: [],
      error: 'Blockchain connection not available'
    };
  }

  try {
    const { contract, provider } = connection;
    const exists = await contract.verifyHash(hash);

    if (!exists) {
      return {
        onChain: true,
        exists: false,
        hash,
        events: []
      };
    }

    const ts = await contract.getHashTimestamp(hash);
    const timestamp = new Date(Number(ts) * 1000);

    // Hash is indexed in the event, so we can filter by exact hash.
    const filter = contract.filters.HashStored(hash);
    const logs = await contract.queryFilter(filter, 0, 'latest');

    const events = await Promise.all(
      logs.map(async (log: any) => {
        const block = await provider.getBlock(log.blockNumber);
        const storedBy = log?.args?.storedBy ? String(log.args.storedBy) : undefined;

        return {
          event: 'HashStored',
          transactionHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: block?.timestamp ? new Date(Number(block.timestamp) * 1000) : undefined,
          storedBy
        };
      })
    );

    const latestEvent = events.length > 0 ? events[events.length - 1] : undefined;

    return {
      onChain: true,
      exists: true,
      hash,
      timestamp,
      transactionHash: latestEvent?.transactionHash,
      blockNumber: latestEvent?.blockNumber,
      events
    };
  } catch (error: any) {
    return {
      onChain: false,
      exists: false,
      hash,
      events: [],
      error: error.message
    };
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use storeHashOnBlockchain instead
 */
export const storeHashLocal = storeHashOnBlockchain;
