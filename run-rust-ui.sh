#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$ROOT_DIR/rust-traceability-ui"

if ! command -v cargo >/dev/null 2>&1; then
  echo "ERROR: Rust toolchain not found. Install from https://rustup.rs"
  exit 1
fi

echo "Building and launching Rust GUI..."
cd "$UI_DIR"
cargo run --release
