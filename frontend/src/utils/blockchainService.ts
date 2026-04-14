import { ethers, BrowserProvider, Contract } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BLOCKCHAIN_ENABLED = import.meta.env.VITE_BLOCKCHAIN_ENABLED === 'true';
const CONTRACT_ADDRESS = import.meta.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS || '';
const CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID || '31337');

// Smart contract ABI (only the functions we need)
const CONTRACT_ABI = [
  'function storeHash(string memory hash) public',
  'function verifyHash(string memory hash) public view returns (bool)',
  'function getHashTimestamp(string memory hash) public view returns (uint256)',
  'function getHashes() public view returns (string[] memory)',
  'function getHashCount() public view returns (uint256)',
  'function getInfo() public view returns (address _owner, uint256 _hashCount, uint256 _blockNumber, uint256 _timestamp)',
  'event HashStored(string indexed hash, uint256 timestamp, address indexed storedBy)'
];

export interface BlockchainStatus {
  enabled: boolean;
  connected: boolean;
  contractAddress?: string;
  hashCount?: number;
  blockNumber?: number;
  owner?: string;
  error?: string;
}

export interface HashVerification {
  exists: boolean;
  timestamp?: Date;
  onChain: boolean;
  error?: string;
}

export interface WalletConnection {
  connected: boolean;
  address?: string;
  balance?: string;
  chainId?: number;
  error?: string;
}

/**
 * Blockchain Service for Frontend
 */
class BlockchainService {
  private provider: BrowserProvider | ethers.JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Get blockchain status from backend
   */
  async getStatus(): Promise<BlockchainStatus> {
    try {
      const response = await fetch(`${API_URL}/api/blockchain/status`);
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Failed to get blockchain status:', error);
      return {
        enabled: false,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Verify hash via backend
   */
  async verifyHash(hash: string): Promise<HashVerification> {
    try {
      const response = await fetch(`${API_URL}/api/blockchain/verify/${hash}`);
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Failed to verify hash:', error);
      return {
        exists: false,
        onChain: false,
        error: error.message
      };
    }
  }

  /**
   * Verify data matches hash via backend
   */
  async verifyData(data: any, hash: string): Promise<{
    matches: boolean;
    computedHash: string;
    providedHash: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/api/blockchain/verify-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, hash })
      });
      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Failed to verify data:', error);
      throw error;
    }
  }

  /**
   * Generate hash from data via backend
   */
  async generateHash(data: any): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/api/blockchain/generate-hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const result = await response.json();
      return result.data.hash;
    } catch (error: any) {
      console.error('Failed to generate hash:', error);
      throw error;
    }
  }

  /**
   * Get all hashes from blockchain via backend
   */
  async getAllHashes(): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/api/blockchain/hashes`);
      const result = await response.json();
      return result.data.hashes || [];
    } catch (error: any) {
      console.error('Failed to get hashes:', error);
      return [];
    }
  }

  /**
   * Connect to MetaMask or other Web3 wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    if (!BLOCKCHAIN_ENABLED) {
      return {
        connected: false,
        error: 'Blockchain not enabled'
      };
    }

    if (typeof window.ethereum === 'undefined') {
      return {
        connected: false,
        error: 'MetaMask not installed'
      };
    }

    try {
      // Request account access
      await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      // Check if we're on the correct network
      if (Number(network.chainId) !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            return {
              connected: false,
              error: 'Please add the network to MetaMask'
            };
          }
          throw switchError;
        }
      }

      // Initialize contract if address is available
      if (CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          this.signer
        );
      }

      return {
        connected: true,
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId)
      };
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get contract instance (requires wallet connection)
   */
  getContract(): Contract | null {
    return this.contract;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  /**
   * Store hash directly on blockchain (requires wallet connection)
   */
  async storeHashOnChain(hash: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    if (!this.contract) {
      return {
        success: false,
        error: 'Contract not initialized. Please connect wallet first.'
      };
    }

    try {
      const tx = await this.contract.storeHash(hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      console.error('Failed to store hash on chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Listen for HashStored events
   */
  onHashStored(callback: (hash: string, timestamp: number, storedBy: string) => void) {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return () => {};
    }

    const filter = this.contract.filters.HashStored();
    this.contract.on(filter, (hash: string, timestamp: bigint, storedBy: string) => {
      callback(hash, Number(timestamp), storedBy);
    });

    // Return cleanup function
    return () => {
      this.contract?.off(filter, callback as  any);
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Export for use in components
export default blockchainService;
