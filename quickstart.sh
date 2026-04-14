#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BLOCKCHAIN_DIR="$ROOT_DIR/blockchain"
SCHEMA_FILE="$BACKEND_DIR/src/config/schema.sql"
MIGRATIONS_DIR="$BACKEND_DIR/src/migrations"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
BACKEND_PORT="${BACKEND_PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
RPC_URL="http://127.0.0.1:8545"

HARDHAT_LOG="/tmp/orion-hardhat.log"
BACKEND_LOG="/tmp/orion-backend.log"
FRONTEND_LOG="/tmp/orion-frontend.log"
PID_FILE="/tmp/orion-hackathon.pids"

MODE="start"
ENABLE_BLOCKCHAIN="true"
AUTO_OPEN="false"

print_help() {
    cat <<'EOF'
Usage:
  ./quickstart.sh [start|stop|status|doctor] [options]

Modes:
  start   Bootstrap DB, build, and run blockchain + backend + frontend (default)
  stop    Stop running stack from pid file and known ports
  status  Show current backend/system status
  doctor  Validate local prerequisites and project structure

Options (for start mode):
  --no-blockchain   Skip blockchain node + deploy
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

echo "================================================="
echo "Orion-PharmaTics Quickstart (Judge Safe Runner)"
echo "================================================="

ensure_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        echo "Missing required directory: $dir"
        exit 1
    fi
}

ensure_cmd() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Missing required command: $cmd"
        exit 1
    fi
}

ensure_node_modules() {
    local dir="$1"
    if [[ ! -d "$dir/node_modules" ]]; then
        echo "Installing dependencies in $(basename "$dir")..."
        (cd "$dir" && npm install)
    else
        echo "Dependencies already installed in $(basename "$dir")"
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

ensure_postgres_tools() {
    if command -v psql >/dev/null 2>&1 && command -v pg_isready >/dev/null 2>&1; then
        return 0
    fi

    if ! command -v brew >/dev/null 2>&1; then
        echo "Missing PostgreSQL CLI tools (psql/pg_isready) and Homebrew is unavailable."
        echo "Install PostgreSQL tools and rerun ./quickstart.sh"
        exit 1
    fi

    echo "Installing PostgreSQL client tools (libpq) via Homebrew..."
    if ! brew list --versions libpq >/dev/null 2>&1; then
        brew install libpq
    fi

    local libpq_bin
    libpq_bin="$(brew --prefix libpq)/bin"
    export PATH="$libpq_bin:$PATH"
    hash -r

    if ! command -v psql >/dev/null 2>&1 || ! command -v pg_isready >/dev/null 2>&1; then
        echo "PostgreSQL CLI tools are still unavailable after installation."
        exit 1
    fi
}

ensure_postgres_running() {
    local db_host="$1"
    local db_port="$2"
    local db_user="$3"

    if pg_isready -h "$db_host" -p "$db_port" -U "$db_user" >/dev/null 2>&1; then
        return 0
    fi

    if command -v brew >/dev/null 2>&1; then
        local formula=""
        formula="$(brew list --formula | grep -E '^postgresql(@[0-9]+)?$' | sort -Vr | head -n 1 || true)"
        if [[ -z "$formula" ]]; then
            echo "Installing PostgreSQL server via Homebrew..."
            brew install postgresql
            formula="postgresql"
        fi

        echo "Starting PostgreSQL service ($formula)..."
        brew services start "$formula" >/dev/null 2>&1 || true
    fi

    local i
    for ((i=1; i<=30; i++)); do
        if pg_isready -h "$db_host" -p "$db_port" -U "$db_user" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    return 1
}

load_backend_env() {
    if [[ -f "$BACKEND_ENV_FILE" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "$BACKEND_ENV_FILE"
        set +a
    fi
}

bootstrap_database() {
    load_backend_env

    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"
    local db_user="${DB_USER:-postgres}"
    local db_name="${DB_NAME:-orion_pharmatics}"
    local db_password="${DB_PASSWORD:-}"

    ensure_postgres_tools

    export PGPASSWORD="$db_password"

    echo "Preparing PostgreSQL database ${db_name}..."
    if ! ensure_postgres_running "$db_host" "$db_port" "$db_user"; then
        echo "PostgreSQL is not reachable at ${db_host}:${db_port}."
        echo "Start PostgreSQL and rerun ./quickstart.sh"
        exit 1
    fi

    local db_exists
    db_exists="$(psql -h "$db_host" -p "$db_port" -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'")"
    if [[ "$db_exists" != "1" ]]; then
        psql -h "$db_host" -p "$db_port" -U "$db_user" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${db_name}\""
        echo "Created database ${db_name}"
    else
        echo "Database ${db_name} already exists"
    fi

    psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DROP TYPE IF EXISTS batch_stage_enum CASCADE;
DROP TYPE IF EXISTS batch_status_enum CASCADE;
DROP TYPE IF EXISTS alert_type_enum CASCADE;
DROP TYPE IF EXISTS alert_severity_enum CASCADE;
DROP TYPE IF EXISTS log_type_enum CASCADE;
SQL

    psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE" >/dev/null
    echo "Applied base schema"

    if [[ -d "$MIGRATIONS_DIR" ]]; then
        shopt -s nullglob
        local migration_files=("$MIGRATIONS_DIR"/*.sql)
        shopt -u nullglob
        for migration_file in "${migration_files[@]}"; do
            psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -f "$migration_file" >/dev/null
            echo "Applied migration $(basename "$migration_file")"
        done
    fi

    echo "Seeding deterministic demo dataset"
    (cd "$BACKEND_DIR" && npm run seed:demo >/dev/null)
    echo "Database bootstrap complete"
}

doctor() {
    echo "=== Orion-PharmaTics Quickstart Doctor ==="
    local ok=true
    for cmd in node npm npx curl lsof perl brew; do
        if command -v "$cmd" >/dev/null 2>&1; then
            echo "[OK] $cmd"
        else
            echo "[MISSING] $cmd"
            ok=false
        fi
    done

    ensure_postgres_tools

    for dir in "$BACKEND_DIR" "$FRONTEND_DIR" "$BLOCKCHAIN_DIR"; do
        if [[ -d "$dir" ]]; then
            echo "[OK] $(basename "$dir") directory"
        else
            echo "[MISSING] directory: $dir"
            ok=false
        fi
    done

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

cleanup() {
    echo
    echo "Stopping quickstart stack..."
    [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
    [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
    [[ -n "${HARDHAT_PID:-}" ]] && kill "$HARDHAT_PID" 2>/dev/null || true
}

ensure_dir "$BACKEND_DIR"
ensure_dir "$FRONTEND_DIR"
ensure_dir "$BLOCKCHAIN_DIR"
ensure_dir "$(dirname "$SCHEMA_FILE")"

ensure_cmd node
ensure_cmd npm
ensure_cmd npx
ensure_cmd curl
ensure_cmd lsof

if [[ "$MODE" == "doctor" ]]; then
    doctor
    exit $?
fi

if [[ "$MODE" == "stop" ]]; then
    stop_stack
    exit 0
fi

if [[ "$MODE" == "status" ]]; then
    status_stack
    exit $?
fi

trap cleanup INT TERM EXIT

echo "Step 1/5: Checking and installing node modules if missing"
ensure_node_modules "$BACKEND_DIR"
ensure_node_modules "$FRONTEND_DIR"
ensure_node_modules "$BLOCKCHAIN_DIR"

echo "Step 2/5: Preparing database (create + schema + migrations + seed)"
bootstrap_database

echo "Step 3/5: Building backend (compile check)"
(cd "$BACKEND_DIR" && npm run build)

echo "Step 4/5: Building frontend (compile check)"
(cd "$FRONTEND_DIR" && npm run build)

echo "Step 5/5: Launching stack"

CONTRACT_ADDRESS=""
if [[ "$ENABLE_BLOCKCHAIN" == "true" ]]; then
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

if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
    touch "$BACKEND_ENV_FILE"
fi

if [[ "$ENABLE_BLOCKCHAIN" == "true" ]]; then
    update_env_var "$BACKEND_ENV_FILE" "BLOCKCHAIN_ENABLED" "true"
    update_env_var "$BACKEND_ENV_FILE" "BLOCKCHAIN_RPC_URL" "$RPC_URL"
    update_env_var "$BACKEND_ENV_FILE" "BLOCKCHAIN_CONTRACT_ADDRESS" "$CONTRACT_ADDRESS"
else
    update_env_var "$BACKEND_ENV_FILE" "BLOCKCHAIN_ENABLED" "false"
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
if [[ "$ENABLE_BLOCKCHAIN" == "true" ]]; then
    printf '%s\n' "Blockchain contract: ${CONTRACT_ADDRESS}"
else
    printf '%s\n' "Blockchain: disabled by flag"
fi
printf '%s\n' "Logs: $HARDHAT_LOG | $BACKEND_LOG | $FRONTEND_LOG"
printf '%s\n' "PIDs: $PID_FILE"
echo

if [[ "$AUTO_OPEN" == "true" ]] && command -v open >/dev/null 2>&1; then
    open "http://localhost:${FRONTEND_PORT}"
    open "http://localhost:${BACKEND_PORT}/api/health/system"
fi

wait
