#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BLOCKCHAIN_DIR="$ROOT_DIR/blockchain"
RUST_OS_DIR="$ROOT_DIR/rust-secure-os"

BACKEND_PORT="${BACKEND_PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
RPC_URL="http://127.0.0.1:8545"

HARDHAT_LOG="/tmp/orion-hardhat.log"
BACKEND_LOG="/tmp/orion-backend.log"
FRONTEND_LOG="/tmp/orion-frontend.log"
RUST_BUILD_LOG="/tmp/orion-rust-build.log"
PID_FILE="/tmp/orion-hackathon.pids"

MODE="start"
ENABLE_BLOCKCHAIN="true"
ENABLE_SEED="true"
AUTO_OPEN="false"

print_help() {
  cat <<'EOF'
Usage:
  ./Start_file.sh [start|stop|status|doctor] [options]

Modes:
  start   Start blockchain, backend, frontend (default)
  stop    Stop running stack from pid file and known ports
  status  Show current backend/system status
  doctor  Validate local prerequisites and project structure

Options (for start mode):
  --no-blockchain   Skip blockchain node + deploy
  --no-seed         Skip demo data seed
  --open            Open frontend and health URLs in browser (macOS)
  -h, --help        Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    start|stop|status|doctor)
      MODE="$1"
      shift
      ;;
    --no-blockchain)
      ENABLE_BLOCKCHAIN="false"
      shift
      ;;
    --no-seed)
      ENABLE_SEED="false"
      shift
      ;;
    --open)
      AUTO_OPEN="true"
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      print_help
      exit 1
      ;;
  esac
done

require_dir() {
  if [[ ! -d "$1" ]]; then
    echo "Missing required directory: $1"
    exit 1
  fi
}

wait_for_http() {
  local url="$1"
  local max_tries="${2:-40}"
  local delay_secs="${3:-1}"
  local i
  for ((i=1; i<=max_tries; i++)); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay_secs"
  done
  return 1
}

ensure_deps() {
  local dir="$1"
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm install)
  fi
}

update_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "$file"; then
    perl -i -pe "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

cleanup() {
  echo
  echo "Stopping hackathon stack..."
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${HARDHAT_PID:-}" ]] && kill "$HARDHAT_PID" 2>/dev/null || true
}

doctor() {
  echo "=== Orion-PharmaTics Doctor ==="
  local ok=true
  for cmd in node npm npx curl lsof perl rustc cargo; do
    if command -v "$cmd" >/dev/null 2>&1; then
      echo "[OK] $cmd"
    else
      echo "[MISSING] $cmd"
      ok=false
    fi
  done

  require_dir "$BACKEND_DIR"
  require_dir "$FRONTEND_DIR"
  require_dir "$BLOCKCHAIN_DIR"
  require_dir "$RUST_OS_DIR"

  if [[ "$ok" = true ]]; then
    echo "Doctor check passed"
    return 0
  fi

  echo "Doctor check failed"
  return 1
}

stop_stack() {
  echo "Stopping Orion-PharmaTics stack..."
  if [[ -f "$PID_FILE" ]]; then
    while IFS='=' read -r name pid; do
      if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        echo "Stopped $name ($pid)"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  lsof -ti:"$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
  lsof -ti:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true
  lsof -ti:8545 | xargs kill -9 2>/dev/null || true
  echo "Stack stopped"
}

status_stack() {
  echo "=== Orion-PharmaTics Status ==="
  if curl -sSf "http://localhost:${BACKEND_PORT}/api/health/system" >/dev/null 2>&1; then
    curl -s "http://localhost:${BACKEND_PORT}/api/health/system" | python3 -m json.tool
  else
    echo "Backend health endpoint not reachable on port ${BACKEND_PORT}"
    return 1
  fi
}

if [[ "$MODE" = "doctor" ]]; then
  doctor
  exit $?
fi

if [[ "$MODE" = "stop" ]]; then
  stop_stack
  exit 0
fi

if [[ "$MODE" = "status" ]]; then
  status_stack
  exit $?
fi

trap cleanup INT TERM EXIT

echo "=== Orion-PharmaTics Hackathon Launcher ==="

require_dir "$BACKEND_DIR"
require_dir "$FRONTEND_DIR"
require_dir "$BLOCKCHAIN_DIR"
require_dir "$RUST_OS_DIR"

ensure_deps "$BACKEND_DIR"
ensure_deps "$FRONTEND_DIR"
ensure_deps "$BLOCKCHAIN_DIR"

CONTRACT_ADDRESS=""
if [[ "$ENABLE_BLOCKCHAIN" = "true" ]]; then
  echo "Starting local blockchain node..."
  lsof -ti:8545 | xargs kill -9 2>/dev/null || true
  (cd "$BLOCKCHAIN_DIR" && HARDHAT_DISABLE_TELEMETRY_PROMPT=true npx hardhat node > "$HARDHAT_LOG" 2>&1) &
  HARDHAT_PID=$!

  if ! wait_for_http "$RPC_URL" 45 1; then
    echo "Blockchain RPC did not become ready. See $HARDHAT_LOG"
    exit 1
  fi

  echo "Deploying smart contract..."
  DEPLOY_OUTPUT="$(cd "$BLOCKCHAIN_DIR" && HARDHAT_DISABLE_TELEMETRY_PROMPT=true npx hardhat run scripts/deploy.js --network localhost)"
  CONTRACT_ADDRESS="$(echo "$DEPLOY_OUTPUT" | awk -F= '/BLOCKCHAIN_CONTRACT_ADDRESS=/{print $2}' | tail -1)"

  if [[ -z "$CONTRACT_ADDRESS" ]]; then
    echo "Failed to parse contract address from deploy output"
    echo "$DEPLOY_OUTPUT"
    exit 1
  fi

  echo "Using contract: $CONTRACT_ADDRESS"
fi

echo "Building Rust secure OS engine..."
(cd "$RUST_OS_DIR" && cargo build --release > "$RUST_BUILD_LOG" 2>&1)
RUST_SECURITY_BIN="$RUST_OS_DIR/target/release/secure_os_guard"

ENV_FILE="$BACKEND_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  touch "$ENV_FILE"
fi

if [[ "$ENABLE_BLOCKCHAIN" = "true" ]]; then
  update_env_var "$ENV_FILE" "BLOCKCHAIN_ENABLED" "true"
  update_env_var "$ENV_FILE" "BLOCKCHAIN_RPC_URL" "$RPC_URL"
  update_env_var "$ENV_FILE" "BLOCKCHAIN_CONTRACT_ADDRESS" "$CONTRACT_ADDRESS"
else
  update_env_var "$ENV_FILE" "BLOCKCHAIN_ENABLED" "false"
fi
update_env_var "$ENV_FILE" "RUST_SECURITY_BIN" "$RUST_SECURITY_BIN"

if [[ "$ENABLE_SEED" = "true" ]]; then
  echo "Seeding deterministic demo dataset..."
  (cd "$BACKEND_DIR" && npm run seed:demo >/dev/null)
fi

echo "Starting backend..."
lsof -ti:"$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
(cd "$BACKEND_DIR" && npm run dev > "$BACKEND_LOG" 2>&1) &
BACKEND_PID=$!

if ! wait_for_http "http://localhost:${BACKEND_PORT}/api/health/system" 45 1; then
  echo "Backend did not become ready. See $BACKEND_LOG"
  exit 1
fi

echo "Starting frontend..."
lsof -ti:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true
(cd "$FRONTEND_DIR" && npm run dev > "$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!

cat > "$PID_FILE" <<EOF
backend=${BACKEND_PID}
frontend=${FRONTEND_PID}
hardhat=${HARDHAT_PID:-}
EOF

echo
printf '%s\n' "Launch complete"
printf '%s\n' "Frontend:  http://localhost:${FRONTEND_PORT}"
printf '%s\n' "Backend:   http://localhost:${BACKEND_PORT}"
printf '%s\n' "Health:    http://localhost:${BACKEND_PORT}/api/health/system"
if [[ "$ENABLE_BLOCKCHAIN" = "true" ]]; then
  printf '%s\n' "Blockchain contract: ${CONTRACT_ADDRESS}"
else
  printf '%s\n' "Blockchain: disabled by flag"
fi
printf '%s\n' "Logs: $HARDHAT_LOG | $BACKEND_LOG | $FRONTEND_LOG"
printf '%s\n' "PIDs: $PID_FILE"
echo

if [[ "$AUTO_OPEN" = "true" ]] && command -v open >/dev/null 2>&1; then
  open "http://localhost:${FRONTEND_PORT}"
  open "http://localhost:${BACKEND_PORT}/api/health/system"
fi

wait
