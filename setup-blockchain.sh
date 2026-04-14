#!/bin/bash

# Blockchain Setup Script for Orion-PharmaTics
# Sets up local Hardhat blockchain and deploys smart contract

set -e  # Exit on error

echo "⛓️  Orion-PharmaTics Blockchain Setup"
echo "======================================="
echo ""

# Check if script is run from the root directory
if [ ! -f "start.sh" ]; then    
    echo "❌ This script must be run from the root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Navigate to blockchain directory
cd blockchain

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing blockchain dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Blockchain dependencies already installed"
    echo ""
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile
echo "✅ Contracts compiled"
echo ""

# Check if Hardhat node is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Hardhat node is already running on port 8545"
    read -p "Do you want to stop it and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping existing Hardhat node..."
        kill $(lsof -t -i:8545) 2>/dev/null || true
        sleep 2
    else
        echo "ℹ️  Using existing Hardhat node"
        SKIP_NODE_START=true
    fi
fi

# Start Hardhat node in background
if [ "$SKIP_NODE_START" != "true" ]; then
    echo "🚀 Starting Hardhat local blockchain node..."
    npx hardhat node > hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    echo "   PID: $HARDHAT_PID"
    
    # Wait for node to be ready
    echo "   Waiting for node to start..."
    sleep 5
    
    if ! lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Failed to start Hardhat node"
        echo "Check hardhat-node.log for errors"
        exit 1
    fi
    
    echo "✅ Hardhat node running on http://127.0.0.1:8545"
    echo "   Logs: blockchain/hardhat-node.log"
    echo ""
fi

# Deploy contract
echo "📝 Deploying LogStorage smart contract..."
npm run deploy

# Extract contract address from deployment output
if [ -f "deployment-output.txt" ]; then
    CONTRACT_ADDRESS=$(grep "Contract Address:" deployment-output.txt | awk '{print $NF}')
else
    echo ""
    echo "⚠️  Please copy the contract address from the output above"
    read -p "Enter contract address: " CONTRACT_ADDRESS
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Blockchain Setup Complete!                            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   RPC URL: http://127.0.0.1:8545"
echo "   Chain ID: 31337"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo ""
echo "🔧 Next Steps:"
echo ""
echo "1. Update backend/.env:"
echo "   BLOCKCHAIN_ENABLED=true"
echo "   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545"
echo "   BLOCKCHAIN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo "2. Update frontend/.env:"
echo "   VITE_BLOCKCHAIN_ENABLED=true"
echo "   VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545"
echo "   VITE_BLOCKCHAIN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo "3. Restart your servers:"
echo "   ./start.sh"
echo ""
echo "📚 Blockchain Commands:"
echo "   - View logs: tail -f blockchain/hardhat-node.log"
echo "   - Stop node: kill $HARDHAT_PID"
echo "   - Restart node: ./setup-blockchain.sh"
echo ""

# Save deployment info
cd ..
cat > blockchain/deployment.json << EOF
{
  "contractAddress": "$CONTRACT_ADDRESS",
  "rpcUrl": "http://127.0.0.1:8545",
  "chainId": 31337,
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Deployment info saved to blockchain/deployment.json"
echo ""
