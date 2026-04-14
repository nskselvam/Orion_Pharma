# Orion-PharmaTics

Orion-PharmaTics is a pharmaceutical supply-chain platform for cold-chain monitoring, batch traceability, and blockchain-backed verification.

## What this project does

1. Tracks medicine batches from manufacturer to pharmacy.
2. Monitors temperature against allowed ranges.
3. Flags compromised shipments and active alerts.
4. Provides blockchain proof/status for tamper-evident verification.
5. Exposes a demo-ready dashboard and APIs for judge evaluation.

## Tech stack

1. Frontend: React + Vite + TypeScript.
2. Backend: Node.js + Express + TypeScript.
3. Database: PostgreSQL.
4. Blockchain: Hardhat + Solidity + Ethers.

## Repository layout

1. frontend: React application and pages.
2. backend: APIs, controllers, DB logic, seed scripts.
3. blockchain: Smart contract and local Hardhat network tooling.
4. quickstart.sh: Primary one-command bootstrap and launcher.

## One-command run (recommended)

From repository root:

```bash
./quickstart.sh start
```

This command automatically:

1. Installs missing Node dependencies (backend, frontend, blockchain).
2. Ensures PostgreSQL CLI tools are available (installs libpq via Homebrew if needed).
3. Ensures PostgreSQL service is running.
4. Creates database if missing.
5. Applies base schema and SQL migrations.
6. Seeds deterministic demo data.
7. Builds backend and frontend.
8. Starts local blockchain node and deploys contract.
9. Starts backend and frontend servers.

## Quickstart commands

```bash
./quickstart.sh start
./quickstart.sh start --no-blockchain
./quickstart.sh start --open
./quickstart.sh doctor
./quickstart.sh status
./quickstart.sh stop
```

## Local URLs

1. Frontend: http://localhost:5173
2. Backend: http://localhost:5001
3. System health: http://localhost:5001/api/health/system
4. DB health: http://localhost:5001/api/health/db
5. Blockchain status: http://localhost:5001/api/blockchain/status

## Frontend routes

1. / -> Dashboard
2. /traceability -> Traceability view
3. /batch/:batchId -> Batch details
4. /verify -> Verification page
5. /cold-chain -> Cold-chain monitoring
6. /inventory -> Inventory view
7. /secure-terminal -> Secure terminal page

## Key backend route groups

1. /api/auth
2. /api/admin
3. /api/pharma/batch
4. /api/pharma/alerts
5. /api/pharma/location
6. /api/pharma/simulate
7. /api/pharma/verify
8. /api/pharma/risk
9. /api/pharma/secure-os
10. /api/blockchain

## Environment configuration

Copy and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

Minimum variables to verify in backend/.env:

1. PORT (default in this project run flow is 5001).
2. DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.
3. JWT_SECRET, JWT_EXPIRES_IN.
4. CORS_ORIGIN.

Notes:

1. quickstart.sh updates blockchain-related variables automatically when blockchain mode is enabled.
2. Database bootstrap uses values from backend/.env.

## Manual run (fallback)

Backend:

```bash
cd backend
npm install
npm run build
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Blockchain:

```bash
cd blockchain
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Database seed only:

```bash
cd backend
npm run seed:demo
```

## Verification checklist for judges

1. Run ./quickstart.sh start.
2. Open http://localhost:5173.
3. Open http://localhost:5001/api/health/system and confirm success=true.
4. Visit /traceability, /verify, /cold-chain, and /inventory in the UI.
5. Run ./quickstart.sh status for formatted health output.

## Troubleshooting

1. If quickstart exits with code 130, the process was interrupted (Ctrl+C). Re-run ./quickstart.sh start.
2. If ports are busy, run ./quickstart.sh stop, then start again.
3. If PostgreSQL is unavailable, quickstart attempts auto-install/start on macOS. If it still fails, start PostgreSQL manually and re-run.
4. If backend fails to start, inspect /tmp/orion-backend.log.
5. If frontend fails to start, inspect /tmp/orion-frontend.log.
6. If blockchain deploy fails, inspect /tmp/orion-hardhat.log.
# Orion_Pharma
